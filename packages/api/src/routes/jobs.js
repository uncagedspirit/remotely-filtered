const express                          = require('express')
const router                           = express.Router()
const { getJobs }                      = require('../utils/db')
const { scoreJob, jobPassesSkillFilter } = require('../utils/score')

router.get('/', (req, res) => {
  try {
    const {
      skills     = '',
      experience = '0',
      jobType    = 'any',
      salaryMin  = null,
      salaryMax  = null,
      keyword    = '',
      showNoVisa = 'false',
    } = req.query

    const selectedSkills = skills
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : []

    // Step 1: get jobs from DB with basic SQL filters
    const jobs = getJobs({
      job_type:     jobType,
      salary_min:   salaryMin ? Number(salaryMin) : null,
      experience:   Number(experience),
      show_no_visa: showNoVisa === 'true',
    })

    // Step 2: score every job
    const scored = jobs.map(job => ({
      ...job,
      match_score: scoreJob(job, selectedSkills),
    }))

    // Step 3: HARD skill filter
    // If skills selected, job MUST match at least one in title or skills tags
    // Description alone doesn't count — avoids false positives
    const skillFiltered = selectedSkills.length > 0
      ? scored.filter(job => jobPassesSkillFilter(job, selectedSkills))
      : scored

    // Step 4: keyword filter
    const keywordFiltered = keyword
      ? skillFiltered.filter(job => {
          const text = `${job.title} ${job.company} ${job.description}`.toLowerCase()
          return text.includes(keyword.toLowerCase())
        })
      : skillFiltered

    // Step 5: salary max filter (min is handled in DB query)
    const salaryMax_n = salaryMax ? Number(salaryMax) : null
    const salaryFiltered = keywordFiltered.filter(job => {
      if (!salaryMax_n) return true
      if (!job.salary_max) return true
      return job.salary_max <= salaryMax_n
    })

    // Step 6: sort — highest match score first, then newest
    const results = salaryFiltered.sort((a, b) => {
      if (b.match_score !== a.match_score) return b.match_score - a.match_score
      return (b.scraped_at || 0) - (a.scraped_at || 0)
    })

    // Step 7: just in case — below salary but strong skill match
    const salaryTarget = salaryMin ? Number(salaryMin) : null
    const justInCase = salaryTarget
      ? scored
          .filter(job =>
            jobPassesSkillFilter(job, selectedSkills) &&
            job.salary_min &&
            job.salary_min < salaryTarget &&
            job.match_score >= 50
          )
          .sort((a, b) => b.match_score - a.match_score)
          .slice(0, 6)
      : []

    res.json({ count: results.length, results, justInCase })

  } catch (err) {
    console.error('[api] /jobs error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router