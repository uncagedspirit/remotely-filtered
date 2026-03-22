const SKILL_SYNONYMS = {
  'React':         ['react', 'reactjs', 'react.js'],
  'React Native':  ['react native', 'react-native'],
  'Next.js':       ['next', 'nextjs', 'next.js'],
  'Vue':           ['vue', 'vuejs', 'vue.js', 'nuxt'],
  'Node.js':       ['node', 'nodejs', 'node.js', 'express', 'fastify', 'nestjs'],
  'Python':        ['python', 'django', 'flask', 'fastapi'],
  'TypeScript':    ['typescript', 'ts'],
  'JavaScript':    ['javascript', 'js', 'es6'],
  'Go':            ['go', 'golang'],
  'Rust':          ['rust'],
  'GraphQL':       ['graphql', 'apollo', 'gql'],
  'PostgreSQL':    ['postgresql', 'postgres', 'psql'],
  'MongoDB':       ['mongodb', 'mongo', 'mongoose'],
  'Redis':         ['redis'],
  'AWS':           ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  'Docker':        ['docker', 'containerization'],
  'Kubernetes':    ['kubernetes', 'k8s'],
  'Tailwind':      ['tailwind', 'tailwindcss'],
}

function textMatchesSkill(text, skillLabel) {
  const synonyms = SKILL_SYNONYMS[skillLabel] || [skillLabel.toLowerCase()]
  return synonyms.some(syn => {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
  })
}

function scoreJob(job, selectedSkills) {
  if (!selectedSkills || selectedSkills.length === 0) return 0

  const haystack = [
    job.description || '',
    (job.skills || []).join(' '),
    job.title || '',
  ].join(' ')

  let matched = 0
  for (const skill of selectedSkills) {
    if (textMatchesSkill(haystack, skill)) matched++
  }

  return Math.round((matched / selectedSkills.length) * 100)
}

module.exports = { scoreJob }