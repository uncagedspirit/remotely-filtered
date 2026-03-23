const axios = require('axios')
const { normalizeJob, parseFlags } = require('../utils/normalize')

// Fetch multiple tech categories
const CATEGORIES = ['engineering', 'design', 'devops', 'data-science']

async function scrapeJobicy() {
  console.log('[jobicy] starting scrape...')
  const allJobs = []

  for (const tag of CATEGORIES) {
    try {
      const { data } = await axios.get('https://jobicy.com/api/v2/remote-jobs', {
        params: { count: 50, tag },
        timeout: 15000,
      })
      const jobs = data?.jobs || []
      allJobs.push(...jobs)
      console.log(`[jobicy] ${jobs.length} jobs for tag: ${tag}`)
      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.warn(`[jobicy] failed for tag ${tag}:`, err.message)
    }
  }

  // dedupe by id
  const seen = new Set()
  const unique = allJobs.filter(job => {
    if (seen.has(job.id)) return false
    seen.add(job.id)
    return true
  })

  console.log(`[jobicy] ${unique.length} unique jobs total`)

  return unique.map(job => {
    const { us_only, visa_sponsorship } = parseFlags(job.jobDescription || '')
    return normalizeJob({
      id:             `jobicy_${job.id}`,
      title:          job.jobTitle,
      company:        job.companyName,
      description:    job.jobDescription || '',
      url:            job.url,
      salary_min:     job.annualSalaryMin || null,
      salary_max:     job.annualSalaryMax || null,
      salary_raw:     job.jobSalary || null,
      skills:         Array.isArray(job.jobIndustry) ? job.jobIndustry : [],
      job_type:       job.jobType || 'full-time',
      experience_raw: null,
      posted_at:      job.pubDate,
      source:         'Jobicy',
      visa_sponsorship,
      us_only,
    })
  })
}

module.exports = { scrapeJobicy }