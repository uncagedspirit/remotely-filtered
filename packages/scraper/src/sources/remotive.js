const axios          = require('axios')
const { normalizeJob, parseFlags } = require('../utils/normalize')

const NOISE_TAGS = new Set([
  'remote', 'remote job', 'remote work', 'full-time', 'part-time',
  'contract', 'freelance', 'usa', 'us', 'canada', 'worldwide',
  'anywhere', 'salary', 'engineer', 'developer', 'senior', 'junior',
])

function parseSalary(raw) {
  if (!raw) return { salary_min: null, salary_max: null }
  const numbers = raw.replace(/,/g, '').match(/\d+/g)
  if (!numbers) return { salary_min: null, salary_max: null }
  if (numbers.length === 1) {
    const n = parseInt(numbers[0])
    // remotive sometimes gives monthly — if under 10k assume monthly
    const normalized = n < 10000 ? n * 12 : n
    return { salary_min: normalized, salary_max: null }
  }
  const [a, b] = numbers.map(Number)
  const salary_min = a < 10000 ? a * 12 : a
  const salary_max = b < 10000 ? b * 12 : b
  return { salary_min, salary_max }
}

function cleanTags(tags) {
  return (tags || [])
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 1 && !NOISE_TAGS.has(t))
}

async function scrapeRemotive() {
  console.log('[remotive] starting scrape...')

  const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
    params: { limit: 100 },
    timeout: 15000,
  })

  const raw = data?.jobs || []
  console.log(`[remotive] got ${raw.length} raw jobs`)

  const normalized = []

  for (const job of raw) {
    try {
      const { us_only, visa_sponsorship } = parseFlags(job.description)
      const { salary_min, salary_max }    = parseSalary(job.salary)

      normalized.push(normalizeJob({
        id:              `remotive_${job.id}`,
        title:           job.title,
        company:         job.company_name,
        description:     job.description,
        url:             job.url,
        salary_min,
        salary_max,
        salary_raw:      job.salary || null,
        skills:          cleanTags(job.tags),
        job_type:        job.job_type,
        experience_raw:  null,   // remotive doesn't provide this
        posted_at:       job.publication_date,
        source:          'Remotive',
        visa_sponsorship,
        us_only,
      }))
    } catch (err) {
      console.warn(`[remotive] failed to normalize job ${job.id}:`, err.message)
    }
  }

  console.log(`[remotive] normalized ${normalized.length} jobs`)
  return normalized
}

module.exports = { scrapeRemotive } 