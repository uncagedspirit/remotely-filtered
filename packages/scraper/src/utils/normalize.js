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
  const cleanDesc = clean(description)
  return {
    id:               id || require('crypto').randomUUID(),
    title:            clean(title),
    company:          clean(company),
    description:      cleanDesc,
    url:              url || null,

    salary_min:       toNumber(salary_min),
    salary_max:       toNumber(salary_max),
    salary_raw:       salary_raw || null,

    skills:           Array.isArray(skills) ? skills : [],
    job_type:         normalizeJobType(job_type),
    experience_raw:   experience_raw || null,
    // Try dedicated field first, fall back to scanning description
    experience_min:   parseExperienceMin(experience_raw, cleanDesc),

    posted_at:        toTimestamp(posted_at),
    scraped_at:       Date.now(),
    source:           source || 'unknown',

    visa_sponsorship: visa_sponsorship === true,
    us_only:          us_only === true,
    is_stale:         isStale(posted_at),

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
  return days > 7
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

/**
 * Parse the minimum years of experience required.
 * First tries the dedicated field, then scans the description text.
 * Returns the LOWEST number found (the minimum requirement).
 */
function parseExperienceMin(experienceRaw, description) {
  // 1. Try the dedicated experience_raw field first
  if (experienceRaw) {
    const m = String(experienceRaw).match(/(\d+)\s*[-+]?\s*(?:to\s*\d+\s*)?years?/i)
    if (m) return parseInt(m[1])
  }

  // 2. Scan description with ordered patterns (most specific first)
  if (description) {
    const patterns = [
      /(\d+)\s*\+\s*years?\s+(?:of\s+)?experience/i,          // "3+ years of experience"
      /minimum\s+(?:of\s+)?(\d+)\s+years?/i,                  // "minimum of 3 years"
      /at\s+least\s+(\d+)\s+years?/i,                          // "at least 3 years"
      /(\d+)\s*[-–]\s*\d+\s+years?\s+(?:of\s+)?experience/i,  // "3-5 years of experience"
      /(\d+)\s+years?\s+(?:of\s+)?(?:relevant\s+|related\s+|professional\s+)?experience/i, // "3 years experience"
      /experience\s*(?:of\s+)?(\d+)\s*\+?\s*years?/i,         // "experience of 3+ years"
      /requires?\s+(\d+)\s+years?/i,                           // "requires 3 years"
    ]

    const found = []
    for (const pattern of patterns) {
      const m = description.match(pattern)
      if (m) found.push(parseInt(m[1]))
    }

    if (found.length > 0) return Math.min(...found)
  }

  return null
}

// ── visa / US-only parser ─────────────────────────────────

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