const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')

const DB_PATH = path.join(__dirname, '../../../../data/jobs.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = normal')

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function getJobs(filters = {}) {
  const conditions = []
  const params     = {}

  // Always limit to jobs scraped within the last 7 days
  conditions.push('scraped_at >= @scraped_since')
  params.scraped_since = Date.now() - ONE_WEEK_MS

  if (filters.job_type && filters.job_type !== 'any') {
    conditions.push('job_type = @job_type')
    params.job_type = filters.job_type
  }

  if (filters.salary_min) {
    conditions.push('(salary_min >= @salary_min OR salary_min IS NULL)')
    params.salary_min = filters.salary_min
  }

  // Experience filter: user says "I have N years", so only show jobs
  // requiring <= N years. Jobs with unknown requirements (NULL) still pass
  // through since we can't rule them out.
  if (filters.experience && filters.experience > 0) {
    conditions.push('(experience_min <= @exp OR experience_min IS NULL)')
    params.exp = Number(filters.experience)
  }

  if (!filters.show_us_only) {
    conditions.push('us_only = 0')
  }

  if (!filters.show_no_visa) {
    conditions.push('visa_sponsorship = 1')
  }

  const where = `WHERE ${conditions.join(' AND ')}`

  const rows = db.prepare(`
    SELECT * FROM jobs
    ${where}
    ORDER BY scraped_at DESC
    LIMIT 200
  `).all(params)

  return rows.map(row => ({
    ...row,
    skills:           JSON.parse(row.skills || '[]'),
    visa_sponsorship: row.visa_sponsorship === 1,
    us_only:          row.us_only === 1,
    is_stale:         row.is_stale === 1,
  }))
}

module.exports = { db, getJobs }