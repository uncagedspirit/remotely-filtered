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

    // Score every job against selected skills
    const scored = jobs.map(job => ({
      ...job,
      match_score: scoreJob(job, selectedSkills),
    }))

    // --- Keyword filter ---
    const keywordFiltered = keyword
      ? scored.filter(job => {
          const text = `${job.title} ${job.company} ${job.description}`.toLowerCase()
          return text.includes(keyword.toLowerCase())
        })
      : scored

    // --- Skill filter ---
    // If skills are selected, ONLY show jobs that match at least one skill
    // The threshold scales: 1 skill = must match it, 2+ skills = must match at least 1
    const skillFiltered = selectedSkills.length > 0
      ? keywordFiltered.filter(job => job.match_score > 0)
      : keywordFiltered

    // --- Salary filter ---
    const salaryTarget = salaryMin ? Number(salaryMin) : null
    const salaryMax_n  = salaryMax ? Number(salaryMax) : null

    const salaryFiltered = skillFiltered.filter(job => {
      // Jobs with no salary listed are always included
      if (!job.salary_min) return true
      // Must be above salaryMin if set
      if (salaryTarget && job.salary_min < salaryTarget) return false
      // Must be below salaryMax if set
      if (salaryMax_n && job.salary_max && job.salary_max > salaryMax_n) return false
      return true
    })

    // --- Sort: by match score desc, then by scraped_at desc ---
    const results = salaryFiltered
      .sort((a, b) => {
        if (b.match_score !== a.match_score) return b.match_score - a.match_score
        return (b.scraped_at || 0) - (a.scraped_at || 0)
      })

    // --- Just in case: below salary but strong skill match ---
    const justInCase = salaryTarget
      ? skillFiltered
          .filter(job =>
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