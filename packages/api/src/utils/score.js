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
  'Kotlin':        ['kotlin'],
  'Swift':         ['swift', 'swiftui'],
  'Ruby':          ['ruby', 'rails', 'ruby on rails'],
  'PHP':           ['php', 'laravel', 'symfony'],
  'C#':            ['c#', 'csharp', '.net', 'dotnet'],
  'C++':           ['c++', 'cpp'],
  'GraphQL':       ['graphql', 'apollo', 'gql'],
  'REST':          ['rest', 'restful', 'rest api'],
  'tRPC':          ['trpc'],
  'PostgreSQL':    ['postgresql', 'postgres', 'psql'],
  'MySQL':         ['mysql'],
  'MongoDB':       ['mongodb', 'mongo', 'mongoose'],
  'Redis':         ['redis'],
  'Elasticsearch': ['elasticsearch', 'elastic', 'opensearch'],
  'Supabase':      ['supabase'],
  'AWS':           ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  'GCP':           ['gcp', 'google cloud'],
  'Azure':         ['azure', 'microsoft azure'],
  'Docker':        ['docker'],
  'Kubernetes':    ['kubernetes', 'k8s'],
  'Terraform':     ['terraform'],
  'CI/CD':         ['ci/cd', 'github actions', 'jenkins', 'circleci'],
  'Tailwind':      ['tailwind', 'tailwindcss'],
  'Figma':         ['figma'],
  'PyTorch':       ['pytorch'],
  'TensorFlow':    ['tensorflow'],
  'LangChain':     ['langchain'],
  'Solidity':      ['solidity', 'web3', 'blockchain'],
}

function matchesSkill(text, skillLabel) {
  const synonyms = SKILL_SYNONYMS[skillLabel] || [skillLabel.toLowerCase()]
  return synonyms.some(syn => {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
  })
}

// STRICT match: skill must appear in title OR in skills tags
// Description alone is NOT enough — that avoids "we used Python internally" false positives
function jobMatchesSkill(job, skillLabel) {
  const titleMatch  = matchesSkill(job.title || '', skillLabel)
  const skillsMatch = matchesSkill(
    (Array.isArray(job.skills) ? job.skills : []).join(' '),
    skillLabel
  )
  return titleMatch || skillsMatch
}

// Score 0-100 based on how many selected skills strictly match
function scoreJob(job, selectedSkills) {
  if (!selectedSkills || selectedSkills.length === 0) return 0

  let matched = 0
  for (const skill of selectedSkills) {
    if (jobMatchesSkill(job, skill)) matched++
  }

  return Math.round((matched / selectedSkills.length) * 100)
}

// Used by the API route to hard-filter jobs
// Returns true only if the job matches AT LEAST ONE selected skill strictly
function jobPassesSkillFilter(job, selectedSkills) {
  if (!selectedSkills || selectedSkills.length === 0) return true
  return selectedSkills.some(skill => jobMatchesSkill(job, skill))
}

module.exports = { scoreJob, jobPassesSkillFilter }