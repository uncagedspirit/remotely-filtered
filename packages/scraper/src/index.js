require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const { scrapeRemotive }  = require('./sources/remotive')
const { scrapeRemoteOK }  = require('./sources/remoteok')
const { scrapeArbeitnow } = require('./sources/arbeitnow')
const { scrapeJobicy }    = require('./sources/jobicy')
const { scrapeHimalayas } = require('./sources/himalayas')
const { upsertJobs }      = require('./utils/db')

async function runScraper() {
  console.log('=== scraper started ===')

  const results = await Promise.allSettled([
    scrapeRemotive(),
    scrapeRemoteOK(),
    scrapeArbeitnow(),
    scrapeJobicy(),
    scrapeHimalayas(),
  ])

  let total = 0

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const jobs = result.value
      if (jobs.length > 0) {
        upsertJobs(jobs)
        console.log(`[db] wrote ${jobs.length} jobs from ${jobs[0]?.source || 'unknown'}`)
        total += jobs.length
      }
    } else {
      console.error('[scraper] source failed:', result.reason?.message || result.reason)
    }
  }

  console.log(`=== scraper done — ${total} total jobs written ===`)
}

runScraper()