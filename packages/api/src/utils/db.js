const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')

const DB_PATH = path.join(__dirname, '../../../../data/jobs.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = normal')

function getJobs(filters = {}) {
  const conditions = []
  const params     = {}

  if (filters.job_type && filters.job_type !== 'any') {
    conditions.push('job_type = @job_type')
    params.job_type = filters.job_type
  }

  if (filters.salary_min) {
    conditions.push('(salary_min >= @salary_min OR salary_min IS NULL)')
    params.salary_min = filters.salary_min
  }

  if (filters.experience && filters.experience > 0) {
    conditions.push('(experience_min <= @exp OR experience_min IS NULL)')
    params.exp = Number(filters.experience) + 1
  }

  if (!filters.show_us_only) {
    conditions.push('us_only = 0')
  }

  if (!filters.show_no_visa) {
    conditions.push('visa_sponsorship = 1')
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

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