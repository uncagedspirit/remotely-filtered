const axios = require('axios')
const { normalizeJob, parseFlags } = require('../utils/normalize')

async function scrapeJobicy() {
  console.log('[jobicy] starting scrape...')

  const { data } = await axios.get('https://jobicy.com/api/v2/remote-jobs', {
    params: { count: 50 },
    timeout: 15000,
  })

  const raw = data?.jobs || []
  console.log(`[jobicy] got ${raw.length} jobs`)

  return raw.map(job => {
    const { us_only, visa_sponsorship } = parseFlags(job.jobDescription || '')

    // jobType can sometimes be an array — take first element, fallback to string
    const rawType = Array.isArray(job.jobType) ? job.jobType[0] : job.jobType
    const jobType = typeof rawType === 'string' ? rawType : 'full-time'

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
      job_type:       jobType,
      experience_raw: null,
      posted_at:      job.pubDate,
      source:         'Jobicy',
      visa_sponsorship,
      us_only,
    })
  })
}

module.exports = { scrapeJobicy }