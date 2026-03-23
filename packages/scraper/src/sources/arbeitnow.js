const axios = require('axios')
const { normalizeJob, parseFlags } = require('../utils/normalize')

async function scrapeArbeitnow() {
  console.log('[arbeitnow] starting scrape...')

  const { data } = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
    timeout: 15000,
  })

  // grab ALL remote jobs — filtering happens in the API, not here
  const raw = (data?.data || []).filter(job => job.remote)
  console.log(`[arbeitnow] got ${raw.length} remote jobs`)

  return raw.map(job => {
    const { us_only, visa_sponsorship } = parseFlags(job.description)
    return normalizeJob({
      id:             `arbeitnow_${job.slug}`,
      title:          job.title,
      company:        job.company_name,
      description:    job.description,
      url:            job.url,
      salary_min:     null,
      salary_max:     null,
      salary_raw:     null,
      skills:         Array.isArray(job.tags) ? job.tags : [],
      job_type:       job.job_types?.[0] || 'full-time',
      experience_raw: null,
      posted_at:      job.created_at,
      source:         'Arbeitnow',
      visa_sponsorship,
      us_only,
    })
  })
}

module.exports = { scrapeArbeitnow }