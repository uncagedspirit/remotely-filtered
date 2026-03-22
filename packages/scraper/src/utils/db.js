const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../../data/jobs.db')

// make sure data/ dir exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

// perf
db.pragma('journal_mode = WAL')
db.pragma('synchronous = normal')

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id               TEXT PRIMARY KEY,
    title            TEXT,
    company          TEXT,
    description      TEXT,
    url              TEXT,
    salary_min       REAL,
    salary_max       REAL,
    salary_raw       TEXT,
    skills           TEXT,
    job_type         TEXT,
    experience_raw   TEXT,
    experience_min   INTEGER,
    posted_at        INTEGER,
    scraped_at       INTEGER,
    source           TEXT,
    visa_sponsorship INTEGER DEFAULT 1,
    us_only          INTEGER DEFAULT 0,
    is_stale         INTEGER DEFAULT 0,
    match_score      REAL
  );

  CREATE INDEX IF NOT EXISTS idx_job_type    ON jobs(job_type);
  CREATE INDEX IF NOT EXISTS idx_salary_min  ON jobs(salary_min);
  CREATE INDEX IF NOT EXISTS idx_scraped_at  ON jobs(scraped_at);
  CREATE INDEX IF NOT EXISTS idx_us_only     ON jobs(us_only);
  CREATE INDEX IF NOT EXISTS idx_visa        ON jobs(visa_sponsorship);
`)

function upsertJob(job) {
  const stmt = db.prepare(`
    INSERT INTO jobs (
      id, title, company, description, url,
      salary_min, salary_max, salary_raw,
      skills, job_type, experience_raw, experience_min,
      posted_at, scraped_at, source,
      visa_sponsorship, us_only, is_stale, match_score
    ) VALUES (
      @id, @title, @company, @description, @url,
      @salary_min, @salary_max, @salary_raw,
      @skills, @job_type, @experience_raw, @experience_min,
      @posted_at, @scraped_at, @source,
      @visa_sponsorship, @us_only, @is_stale, @match_score
    )
    ON CONFLICT(id) DO UPDATE SET
      scraped_at       = excluded.scraped_at,
      is_stale         = excluded.is_stale,
      salary_min       = excluded.salary_min,
      salary_max       = excluded.salary_max
  `)

  // sqlite doesn't store arrays — stringify
  stmt.run({
    ...job,
    skills:           JSON.stringify(job.skills),
    visa_sponsorship: job.visa_sponsorship ? 1 : 0,
    us_only:          job.us_only ? 1 : 0,
    is_stale:         job.is_stale ? 1 : 0,
  })
}

function upsertJobs(jobs) {
  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) upsertJob(job)
  })
  insertMany(jobs)
}

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

  if (filters.experience !== undefined && filters.experience > 0) {
    conditions.push('(experience_min <= @experience + 1 OR experience_min IS NULL)')
    params.experience = filters.experience
  }

  if (!filters.show_us_only) {
    conditions.push('us_only = 0')
  }

  if (!filters.show_no_visa) {
    conditions.push('visa_sponsorship = 1')
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

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

module.exports = { db, upsertJob, upsertJobs, getJobs }