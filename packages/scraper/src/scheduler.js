require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const cron = require('node-cron')

// Inline the scraper run function so we can call it on schedule
const { scrapeRemotive }  = require('./sources/remotive')
const { scrapeRemoteOK }  = require('./sources/remoteok')
const { scrapeArbeitnow } = require('./sources/arbeitnow')
const { scrapeJobicy }    = require('./sources/jobicy')
const { scrapeHimalayas } = require('./sources/himalayas')
const { upsertJobs, pruneOldJobs } = require('./utils/db')

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

async function runScraper() {
  console.log(`\n[${new Date().toISOString()}] === scraper started ===`)

  const pruned = pruneOldJobs()
  console.log(`[db] pruned ${pruned} stale jobs`)

  const results = await Promise.allSettled([
    scrapeRemotive(),
    scrapeRemoteOK(),
    scrapeArbeitnow(),
    scrapeJobicy(),
    scrapeHimalayas(),
  ])

  let total = 0
  const cutoff = Date.now() - ONE_WEEK_MS

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const jobs = result.value
      const fresh = jobs.filter(job => {
        const ts = job.posted_at || job.scraped_at
        return !ts || ts >= cutoff
      })
      if (fresh.length > 0) {
        upsertJobs(fresh)
        console.log(`[db] wrote ${fresh.length}/${jobs.length} fresh jobs from ${fresh[0]?.source || 'unknown'}`)
        total += fresh.length
      }
    } else {
      console.error('[scraper] source failed:', result.reason?.message || result.reason)
    }
  }

  console.log(`[${new Date().toISOString()}] === done — ${total} jobs written ===\n`)
}

// Run immediately on startup so you have fresh data right away
runScraper()

// Then re-run every day at 6:00 AM
cron.schedule('0 6 * * *', () => {
  runScraper()
})

console.log('Scheduler running — scrapes daily at 06:00. Press Ctrl+C to stop.')