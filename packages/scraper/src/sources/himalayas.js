const axios = require('axios')
const { normalizeJob, parseFlags } = require('../utils/normalize')

async function scrapeHimalayas() {
  console.log('[himalayas] starting scrape...')

  // fetch 3 pages of recent jobs — no category filter, API handles that
  const limit = 20
  const pages = 3
  const allJobs = []

  for (let page = 0; page < pages; page++) {
    try {
      const { data } = await axios.get('https://himalayas.app/jobs/api', {
        params: { limit, offset: page * limit },
        timeout: 15000,
      })

      const jobs = data?.jobs || []
      if (jobs.length === 0) break

      allJobs.push(...jobs)
      console.log(`[himalayas] page ${page + 1}: +${jobs.length} jobs`)

      await new Promise(r => setTimeout(r, 800))
    } catch (err) {
      console.warn(`[himalayas] page ${page + 1} failed:`, err.message)
      break
    }
  }

  console.log(`[himalayas] total: ${allJobs.length} jobs`)

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
  if (t.includes('full'))                              return 'full-time'
  if (t.includes('part'))                              return 'part-time'
  if (t.includes('contract') || t.includes('freelance')) return 'contract'
  return 'full-time'
}

module.exports = { scrapeHimalayas }