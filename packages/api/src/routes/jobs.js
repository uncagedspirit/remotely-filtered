const express      = require('express')
const router       = express.Router()
const { getJobs }  = require('../utils/db')
const { scoreJob } = require('../utils/score')

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

    const jobs = getJobs({
      job_type:     jobType,
      salary_min:   salaryMin ? Number(salaryMin) : null,
      experience:   Number(experience),
      show_no_visa: showNoVisa === 'true',
    })

    const scored = jobs.map(job => ({
      ...job,
      match_score: scoreJob(job, selectedSkills),
    }))

    const keywordFiltered = keyword
      ? scored.filter(job => {
          const text = `${job.title} ${job.company} ${job.description}`.toLowerCase()
          return text.includes(keyword.toLowerCase())
        })
      : scored

    const salaryTarget = salaryMin ? Number(salaryMin) : null

    const results = keywordFiltered
      .filter(job => !salaryTarget || !job.salary_min || job.salary_min >= salaryTarget)
      .sort((a, b) => b.match_score - a.match_score)

    const justInCase = salaryTarget
      ? keywordFiltered
          .filter(job => job.salary_min && job.salary_min < salaryTarget && job.match_score >= 50)
          .slice(0, 5)
      : []

    res.json({ count: results.length, results, justInCase })

  } catch (err) {
    console.error('[api] /jobs error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router