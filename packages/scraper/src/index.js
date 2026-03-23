require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const { scrapeRemotive }  = require('./sources/remotive')
const { scrapeRemoteOK }  = require('./sources/remoteok')
const { scrapeArbeitnow } = require('./sources/arbeitnow')
const { scrapeJobicy }    = require('./sources/jobicy')
const { scrapeHimalayas } = require('./sources/himalayas')
const { upsertJobs, pruneOldJobs } = require('./utils/db')

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

async function runScraper() {
  console.log('=== scraper started ===')

  // Remove jobs older than 7 days from the DB before adding new ones
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

      // Only keep jobs posted or scraped within the last 7 days
      const fresh = jobs.filter(job => {
        const ts = job.posted_at || job.scraped_at
        return !ts || ts >= cutoff
      })

      if (fresh.length > 0) {
        upsertJobs(fresh)
        const source = fresh[0]?.source || 'unknown'
        console.log(`[db] wrote ${fresh.length}/${jobs.length} fresh jobs from ${source}`)
        total += fresh.length
      }
    } else {
      console.error('[scraper] source failed:', result.reason?.message || result.reason)
    }
  }

  console.log(`=== scraper done — ${total} total jobs written ===`)
}

runScraper()