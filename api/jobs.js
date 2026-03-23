const SKILL_SYNONYMS = {
  'React':         ['react', 'reactjs', 'react.js', 'react js'],
  'React Native':  ['react native', 'react-native'],
  'Next.js':       ['next', 'nextjs', 'next.js'],
  'Vue':           ['vue', 'vuejs', 'vue.js', 'nuxt', 'nuxtjs'],
  'Angular':       ['angular', 'angularjs'],
  'Svelte':        ['svelte', 'sveltekit'],
  'Node.js':       ['node', 'nodejs', 'node.js', 'express', 'fastify', 'nestjs'],
  'Python':        ['python', 'django', 'flask', 'fastapi'],
  'TypeScript':    ['typescript', 'ts'],
  'JavaScript':    ['javascript', 'js', 'es6', 'vanilla js'],
  'Go':            ['go', 'golang'],
  'Rust':          ['rust'],
  'Java':          ['java', 'spring', 'springboot', 'spring boot'],
  'GraphQL':       ['graphql', 'apollo', 'gql'],
  'PostgreSQL':    ['postgresql', 'postgres', 'psql'],
  'MySQL':         ['mysql'],
  'MongoDB':       ['mongodb', 'mongo', 'mongoose'],
  'Redis':         ['redis'],
  'AWS':           ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  'GCP':           ['gcp', 'google cloud'],
  'Azure':         ['azure', 'microsoft azure'],
  'Docker':        ['docker'],
  'Kubernetes':    ['kubernetes', 'k8s'],
}

function matchesSkill(text, skillLabel) {
  const synonyms = SKILL_SYNONYMS[skillLabel] || [skillLabel.toLowerCase()]
  return synonyms.some(syn => {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp('\\b' + escaped + '\\b', 'i').test(text)
  })
}

function jobMatchesSkill(job, skillLabel) {
  return matchesSkill(job.title || '', skillLabel) ||
    matchesSkill((Array.isArray(job.skills) ? job.skills : []).join(' '), skillLabel)
}

function scoreJob(job, selectedSkills) {
  if (!selectedSkills || selectedSkills.length === 0) return 0
  let matched = 0
  for (const skill of selectedSkills) {
    if (jobMatchesSkill(job, skill)) matched++
  }
  return Math.round((matched / selectedSkills.length) * 100)
}

function jobPassesSkillFilter(job, selectedSkills) {
  if (!selectedSkills || selectedSkills.length === 0) return true
  return selectedSkills.some(skill => jobMatchesSkill(job, skill))
}

async function tursoQuery(sql) {
  const url = process.env.TURSO_URL.replace('libsql://', 'https://') + '/v2/pipeline'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.TURSO_AUTH_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql } },
        { type: 'close' },
      ],
    }),
  })
  const data = await res.json()
  if (data.results && data.results[0] && data.results[0].type === 'error') {
    throw new Error(data.results[0].error.message)
  }
  const result = data.results[0].response.result
  const cols = result.cols.map(c => c.name)
  return result.rows.map(row =>
    Object.fromEntries(cols.map((col, i) => [col, row[i] ? row[i].value : null]))
  )
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const {
      skills     = '',
      experience = '0',
      jobType    = 'any',
      salaryMin  = null,
      salaryMax  = null,
      keyword    = '',
      showNoVisa = 'false',
    } = req.query

    const selectedSkills = skills
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const scraped_since = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const conditions = ['scraped_at >= ' + scraped_since, 'us_only = 0']

    if (jobType && jobType !== 'any') {
      conditions.push("job_type = '" + jobType.replace(/'/g, "''") + "'")
    }
    if (salaryMin) {
      conditions.push('(salary_min >= ' + Number(salaryMin) + ' OR salary_min IS NULL)')
    }
    if (Number(experience) > 0) {
      conditions.push('(experience_min <= ' + Number(experience) + ' OR experience_min IS NULL)')
    }
    if (showNoVisa !== 'true') {
      conditions.push('visa_sponsorship = 1')
    }

    const sql = 'SELECT * FROM jobs WHERE ' + conditions.join(' AND ') + ' ORDER BY scraped_at DESC LIMIT 500'
    const rows = await tursoQuery(sql)

    const jobs = rows.map(row => ({
      ...row,
      skills:           (function() { try { return JSON.parse(row.skills || '[]') } catch(e) { return [] } })(),
      visa_sponsorship: row.visa_sponsorship == 1,
      us_only:          row.us_only == 1,
      is_stale:         row.is_stale == 1,
    }))

    const scored = jobs.map(job => ({
      ...job,
      match_score: scoreJob(job, selectedSkills),
    }))

    const skillFiltered = selectedSkills.length > 0
      ? scored.filter(job => jobPassesSkillFilter(job, selectedSkills))
      : scored

    const keywordFiltered = keyword
      ? skillFiltered.filter(job => {
          const text = (job.title + ' ' + job.company + ' ' + job.description).toLowerCase()
          return text.includes(keyword.toLowerCase())
        })
      : skillFiltered

    const salaryMax_n = salaryMax ? Number(salaryMax) : null
    const salaryFiltered = keywordFiltered.filter(job => {
      if (!salaryMax_n || !job.salary_max) return true
      return job.salary_max <= salaryMax_n
    })

    const results = salaryFiltered.sort((a, b) => {
      if (b.match_score !== a.match_score) return b.match_score - a.match_score
      return (b.scraped_at || 0) - (a.scraped_at || 0)
    })

    const salaryTarget = salaryMin ? Number(salaryMin) : null
    const justInCase = salaryTarget
      ? scored
          .filter(job =>
            jobPassesSkillFilter(job, selectedSkills) &&
            job.salary_min &&
            job.salary_min < salaryTarget &&
            job.match_score >= 50
          )
          .sort((a, b) => b.match_score - a.match_score)
          .slice(0, 6)
      : []

    res.json({ count: results.length, results, justInCase })

  } catch (err) {
    console.error('[api] error:', err.message)
    res.status(500).json({ error: err.message })
  }
}