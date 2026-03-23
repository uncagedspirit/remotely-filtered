const axios = require('axios')
const { normalizeJob, parseFlags } = require('../utils/normalize')

// Only pull tech-relevant categories
const TECH_CATEGORIES = [
  'software-engineer',
  'frontend-engineer',
  'backend-engineer',
  'full-stack-engineer',
  'devops-engineer',
  'data-engineer',
  'data-scientist',
  'mobile-engineer',
]

async function scrapeHimalayas() {
  console.log('[himalayas] starting scrape...')
  const allJobs = []
  const seen = new Set()

  for (const category of TECH_CATEGORIES) {
    try {
      const { data } = await axios.get('https://himalayas.app/jobs/api', {
        params: { limit: 20, offset: 0, q: category },
        timeout: 15000,
      })

      const jobs = data?.jobs || []
      let added = 0

      for (const job of jobs) {
        if (!seen.has(job.guid)) {
          seen.add(job.guid)
          allJobs.push(job)
          added++
        }
      }

      console.log(`[himalayas] +${added} jobs for: ${category}`)
      await new Promise(r => setTimeout(r, 800))
    } catch (err) {
      console.warn(`[himalayas] failed for ${category}:`, err.message)
    }
  }

  console.log(`[himalayas] total unique: ${allJobs.length} jobs`)

  return allJobs.map(job => {
    const desc = job.description || job.excerpt || ''
    const { us_only, visa_sponsorship } = parseFlags(desc)

    const isUSOnly = Array.isArray(job.locationRestrictions) &&
      job.locationRestrictions.length > 0 &&
      job.locationRestrictions.every(l =>
        l === 'US' || l === 'United States' || l === 'USA'
      )

    const salaryRaw = job.minSalary
      ? `${job.currency || 'USD'} ${Number(job.minSalary).toLocaleString()}${job.maxSalary ? ` - ${Number(job.maxSalary).toLocaleString()}` : '+'}`
      : null

    return normalizeJob({
      id:             `himalayas_${job.guid}`,
      title:          job.title,
      company:        job.companyName,
      description:    desc,
      url:            job.applicationLink,
      salary_min:     job.minSalary || null,
      salary_max:     job.maxSalary || null,
      salary_raw:     salaryRaw,
      skills:         Array.isArray(job.categories) ? job.categories : [],
      job_type:       normalizeType(job.employmentType),
      experience_raw: job.seniority || null,
      posted_at:      job.pubDate,
      source:         'Himalayas',
      visa_sponsorship: !isUSOnly && visa_sponsorship,
      us_only:        isUSOnly || us_only,
    })
  })
}

function normalizeType(type) {
  if (!type) return 'full-time'
  const t = type.toLowerCase()
  if (t.includes('full'))     return 'full-time'
  if (t.includes('part'))     return 'part-time'
  if (t.includes('contract') || t.includes('freelance')) return 'contract'
  return 'full-time'
}

module.exports = { scrapeHimalayas }