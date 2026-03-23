const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')

const DB_PATH = path.join(__dirname, '../../../../data/jobs.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

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

  CREATE INDEX IF NOT EXISTS idx_job_type   ON jobs(job_type);
  CREATE INDEX IF NOT EXISTS idx_salary_min ON jobs(salary_min);
  CREATE INDEX IF NOT EXISTS idx_scraped_at ON jobs(scraped_at);
  CREATE INDEX IF NOT EXISTS idx_posted_at  ON jobs(posted_at);
  CREATE INDEX IF NOT EXISTS idx_us_only    ON jobs(us_only);
  CREATE INDEX IF NOT EXISTS idx_visa       ON jobs(visa_sponsorship);
`)

function toStr(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'bigint') return String(val)
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function toNum(val) {
  if (val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function toInt(val) {
  if (val === null || val === undefined) return null
  const n = parseInt(val)
  return isNaN(n) ? null : n
}

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
      salary_max       = excluded.salary_max,
      experience_min   = COALESCE(excluded.experience_min, jobs.experience_min)
  `)

  stmt.run({
    id:               toStr(job.id) || `job_${Date.now()}_${Math.random()}`,
    title:            toStr(job.title),
    company:          toStr(job.company),
    description:      toStr(job.description),
    url:              toStr(job.url),
    salary_min:       toNum(job.salary_min),
    salary_max:       toNum(job.salary_max),
    salary_raw:       toStr(job.salary_raw),
    skills:           JSON.stringify(Array.isArray(job.skills) ? job.skills : []),
    job_type:         toStr(job.job_type),
    experience_raw:   toStr(job.experience_raw),
    experience_min:   toInt(job.experience_min),
    posted_at:        toNum(job.posted_at),
    scraped_at:       toNum(job.scraped_at) || Date.now(),
    source:           toStr(job.source),
    visa_sponsorship: job.visa_sponsorship ? 1 : 0,
    us_only:          job.us_only ? 1 : 0,
    is_stale:         job.is_stale ? 1 : 0,
    match_score:      toNum(job.match_score),
  })
}

function upsertJobs(jobs) {
  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) upsertJob(job)
  })
  insertMany(jobs)
}

/** Remove jobs older than 7 days. Returns count deleted. */
function pruneOldJobs() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  const result = db.prepare(`DELETE FROM jobs WHERE scraped_at < @cutoff`).run({ cutoff })
  return result.changes
}

function getJobs(filters = {}) {
  const conditions = []
  const params     = {}

  conditions.push('scraped_at >= @scraped_since')
  params.scraped_since = Date.now() - (7 * 24 * 60 * 60 * 1000)

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
    SELECT * FROM jobs ${where} ORDER BY scraped_at DESC LIMIT 500
  `).all(params)

  return rows.map(row => ({
    ...row,
    skills:           JSON.parse(row.skills || '[]'),
    visa_sponsorship: row.visa_sponsorship === 1,
    us_only:          row.us_only === 1,
    is_stale:         row.is_stale === 1,
  }))
}

module.exports = { db, upsertJob, upsertJobs, pruneOldJobs, getJobs }