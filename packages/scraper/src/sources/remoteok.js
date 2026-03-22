const axios = require('axios')
const { normalizeJob, parseFlags } = require('../utils/normalize')

const NOISE_TAGS = new Set([
  'remote', 'worldwide', 'global', 'anywhere', 'senior', 'junior',
  'lead', 'staff', 'engineer', 'developer', 'programmer',
])

async function scrapeRemoteOK() {
  console.log('[remoteok] starting scrape...')

  const { data } = await axios.get('https://remoteok.com/api', {
    headers: { 'User-Agent': 'remotely-filtered-job-app' },
    timeout: 15000,
  })

  // first item is a notice object, skip it
  const raw = data.slice(1)
  console.log(`[remoteok] got ${raw.length} raw jobs`)

  const normalized = []

  for (const job of raw) {
    try {
      const { us_only, visa_sponsorship } = parseFlags(job.description)

      const skills = (job.tags || [])
        .map(t => t.toLowerCase().trim())
        .filter(t => t.length > 1 && !NOISE_TAGS.has(t))

      normalized.push(normalizeJob({
        id:             `remoteok_${job.id}`,
        title:          job.position,
        company:        job.company,
        description:    job.description,
        url:            job.url,
        salary_min:     job.salary_min || null,
        salary_max:     job.salary_max || null,
        salary_raw:     job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : null,
        skills,
        job_type:       'full-time',
        experience_raw: null,
        posted_at:      job.date,
        source:         'RemoteOK',
        visa_sponsorship,
        us_only,
      }))
    } catch (err) {
      console.warn(`[remoteok] failed to normalize job ${job.id}:`, err.message)
    }
  }

  console.log(`[remoteok] normalized ${normalized.length} jobs`)
  return normalized
}

module.exports = { scrapeRemoteOK }