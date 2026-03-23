const SKILL_SYNONYMS = {
  'React':         ['react', 'reactjs', 'react.js', 'react js'],
  'React Native':  ['react native', 'react-native'],
  'Next.js':       ['next', 'nextjs', 'next.js'],
  'Vue':           ['vue', 'vuejs', 'vue.js', 'nuxt', 'nuxtjs'],
  'Angular':       ['angular', 'angularjs'],
  'Svelte':        ['svelte', 'sveltekit'],
  'Node.js':       ['node', 'nodejs', 'node.js', 'express', 'fastify', 'nestjs', 'hapi'],
  'Python':        ['python', 'django', 'flask', 'fastapi', 'py'],
  'TypeScript':    ['typescript', 'ts'],
  'JavaScript':    ['javascript', 'js', 'es6', 'es2015', 'vanilla js', 'vanilla javascript'],
  'Go':            ['go', 'golang'],
  'Rust':          ['rust', 'rustlang'],
  'Java':          ['java', 'spring', 'springboot', 'spring boot'],
  'Kotlin':        ['kotlin'],
  'Swift':         ['swift', 'swiftui', 'ios'],
  'Ruby':          ['ruby', 'rails', 'ruby on rails'],
  'PHP':           ['php', 'laravel', 'symfony'],
  'C#':            ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
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
  'AWS':           ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudfront'],
  'GCP':           ['gcp', 'google cloud', 'google cloud platform'],
  'Azure':         ['azure', 'microsoft azure'],
  'Docker':        ['docker', 'containerization', 'containers'],
  'Kubernetes':    ['kubernetes', 'k8s', 'eks', 'gke', 'aks'],
  'Terraform':     ['terraform', 'iac', 'infrastructure as code'],
  'CI/CD':         ['ci/cd', 'github actions', 'jenkins', 'circleci', 'gitlab ci'],
  'Tailwind':      ['tailwind', 'tailwindcss'],
  'Figma':         ['figma'],
  'PyTorch':       ['pytorch'],
  'TensorFlow':    ['tensorflow'],
  'LangChain':     ['langchain'],
  'Solidity':      ['solidity', 'web3', 'blockchain', 'smart contracts', 'ethereum'],
}

function textMatchesSkill(text, skillLabel) {
  const synonyms = SKILL_SYNONYMS[skillLabel] || [skillLabel.toLowerCase()]
  const lowerText = text.toLowerCase()
  return synonyms.some(syn => {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText)
  })
}

function scoreJob(job, selectedSkills) {
  if (!selectedSkills || selectedSkills.length === 0) return 0

  // Build a rich haystack: title weighted 3x, skills 2x, description 1x
  const titleText       = (job.title || '').repeat(3)
  const skillsText      = (Array.isArray(job.skills) ? job.skills.join(' ') : '').repeat(2)
  const descriptionText = job.description || ''

  const haystack = [titleText, skillsText, descriptionText].join(' ')

  let matched = 0
  for (const skill of selectedSkills) {
    if (textMatchesSkill(haystack, skill)) matched++
  }

  return Math.round((matched / selectedSkills.length) * 100)
}

module.exports = { scoreJob, textMatchesSkill }