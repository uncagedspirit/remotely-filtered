export const SKILL_GROUPS = {
  'React':          { synonyms: ['react', 'reactjs', 'react.js'] },
  'React Native':   { synonyms: ['react native', 'react-native'] },
  'Next.js':        { synonyms: ['next', 'nextjs', 'next.js'] },
  'Vue':            { synonyms: ['vue', 'vuejs', 'vue.js', 'nuxt'] },
  'Angular':        { synonyms: ['angular', 'angularjs'] },
  'Svelte':         { synonyms: ['svelte', 'sveltekit'] },
  'Node.js':        { synonyms: ['node', 'nodejs', 'node.js', 'express', 'expressjs', 'fastify', 'nestjs'] },
  'Python':         { synonyms: ['python', 'django', 'flask', 'fastapi'] },
  'TypeScript':     { synonyms: ['typescript', 'ts'] },
  'JavaScript':     { synonyms: ['javascript', 'js', 'es6', 'vanilla js'] },
  'Go':             { synonyms: ['go', 'golang'] },
  'Rust':           { synonyms: ['rust'] },
  'Java':           { synonyms: ['java', 'spring', 'springboot'] },
  'Kotlin':         { synonyms: ['kotlin'] },
  'Swift':          { synonyms: ['swift', 'swiftui'] },
  'GraphQL':        { synonyms: ['graphql', 'apollo', 'gql'] },
  'REST':           { synonyms: ['rest', 'restful', 'rest api'] },
  'tRPC':           { synonyms: ['trpc'] },
  'PostgreSQL':     { synonyms: ['postgresql', 'postgres', 'psql'] },
  'MySQL':          { synonyms: ['mysql'] },
  'MongoDB':        { synonyms: ['mongodb', 'mongo', 'mongoose'] },
  'Redis':          { synonyms: ['redis'] },
  'Elasticsearch':  { synonyms: ['elasticsearch', 'elastic', 'opensearch'] },
  'Supabase':       { synonyms: ['supabase'] },
  'AWS':            { synonyms: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  'GCP':            { synonyms: ['gcp', 'google cloud'] },
  'Azure':          { synonyms: ['azure', 'microsoft azure'] },
  'Docker':         { synonyms: ['docker', 'containerization'] },
  'Kubernetes':     { synonyms: ['kubernetes', 'k8s'] },
  'Terraform':      { synonyms: ['terraform', 'iac'] },
  'CI/CD':          { synonyms: ['ci/cd', 'github actions', 'jenkins', 'circleci'] },
  'Tailwind':       { synonyms: ['tailwind', 'tailwindcss'] },
  'Figma':          { synonyms: ['figma'] },
  'PyTorch':        { synonyms: ['pytorch'] },
  'TensorFlow':     { synonyms: ['tensorflow'] },
  'LangChain':      { synonyms: ['langchain'] },
  'Solidity':       { synonyms: ['solidity', 'web3', 'blockchain', 'smart contracts'] },
}

export const ALL_SKILLS = Object.keys(SKILL_GROUPS)

export const textMatchesSkill = (text, skillLabel) => {
  const synonyms = SKILL_GROUPS[skillLabel]?.synonyms || [skillLabel.toLowerCase()]
  return synonyms.some(syn => {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
  })
}