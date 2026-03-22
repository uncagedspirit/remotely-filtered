const { v4: uuidv4 } = require('crypto').randomUUID ? 
  { v4: () => require('crypto').randomUUID() } : 
  require('crypto')

function normalizeJob({
  id,
  title,
  company,
  description,
  url,
  salary_min,
  salary_max,
  salary_raw,
  skills,
  job_type,
  experience_raw,
  posted_at,
  source,
  visa_sponsorship,
  us_only,
}) {
  return {
    id:               id || require('crypto').randomUUID(),
    title:            clean(title),
    company:          clean(company),
    description:      clean(description),
    url:              url || null,

    salary_min:       toNumber(salary_min),
    salary_max:       toNumber(salary_max),
    salary_raw:       salary_raw || null,

    skills:           Array.isArray(skills) ? skills : [],
    job_type:         normalizeJobType(job_type),
    experience_raw:   experience_raw || null,
    experience_min:   parseExperienceMin(experience_raw),

    posted_at:        toTimestamp(posted_at),
    scraped_at:       Date.now(),
    source:           source || 'unknown',

    // flags
    visa_sponsorship: visa_sponsorship === true,
    us_only:          us_only === true,
    is_stale:         isStale(posted_at),

    // scoring — filled in later by search layer
    match_score:      null,
  }
}

// ── helpers ──────────────────────────────────────────────

function clean(str) {
  if (!str) return ''
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function toNumber(val) {
  if (!val) return null
  const n = Number(String(val).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

function toTimestamp(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.getTime()
}

function isStale(posted_at) {
  if (!posted_at) return false
  const posted = new Date(posted_at).getTime()
  const days   = (Date.now() - posted) / (1000 * 60 * 60 * 24)
  return days > 30
}

function normalizeJobType(raw) {
  if (!raw) return 'unknown'
  const s = raw.toLowerCase()
  if (s.includes('full'))     return 'full-time'
  if (s.includes('contract')) return 'contract'
  if (s.includes('part'))     return 'part-time'
  if (s.includes('freelan'))  return 'contract'
  return 'unknown'
}

function parseExperienceMin(raw) {
  if (!raw) return null
  // matches: "2+ years", "2-4 years", "at least 3 years", "3 years"
  const match = String(raw).match(/(\d+)\s*[-+]?\s*(?:to\s*\d+\s*)?years?/i)
  return match ? parseInt(match[1]) : null
}

// ── visa / US-only parser ─────────────────────────────────
// call this on the raw description text before normalizing

function parseFlags(description) {
  const text = (description || '').toLowerCase()

  const US_ONLY_PATTERNS = [
    'must reside in the us',
    'must be based in the us',
    'must be located in the us',
    'us-based only',
    'united states only',
    'no international applicants',
    'requires us residency',
    'must have us residency',
    'only accepting us',
  ]

  const NO_VISA_PATTERNS = [
    'no visa sponsorship',
    'we do not sponsor',
    'sponsorship not available',
    'cannot sponsor',
    'will not sponsor',
    'no sponsorship',
    'must be authorized to work',
    'must be eligible to work',
    'w2 only',
    '1099 only',
  ]

  const us_only          = US_ONLY_PATTERNS.some(p => text.includes(p))
  const visa_sponsorship = !NO_VISA_PATTERNS.some(p => text.includes(p))

  return { us_only, visa_sponsorship }
}

module.exports = { normalizeJob, parseFlags }