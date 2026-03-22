require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const { scrapeRemotive } = require('./sources/remotive')
const { scrapeRemoteOK } = require('./sources/remoteok')
const { upsertJobs }     = require('./utils/db')

async function runScraper() {
  console.log('=== scraper started ===')

  const results = await Promise.allSettled([
    scrapeRemotive(),
    scrapeRemoteOK(),
  ])

  for (const result of results) {
    if (result.status === 'fulfilled') {
      upsertJobs(result.value)
      console.log(`[db] wrote ${result.value.length} jobs from ${result.value[0]?.source || 'unknown'}`)
    } else {
      console.error('[scraper] source failed:', result.reason.message)
    }
  }

  console.log('=== scraper done ===')
}

runScraper()