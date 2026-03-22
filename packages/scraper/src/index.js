require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const { scrapeRemotive } = require('./sources/remotive')
const { upsertJobs }     = require('./utils/db')

async function runScraper() {
  console.log('=== scraper started ===')

  try {
    const remotiveJobs = await scrapeRemotive()
    upsertJobs(remotiveJobs)
    console.log(`[db] wrote ${remotiveJobs.length} jobs from Remotive`)
  } catch (err) {
    console.error('[remotive] scrape failed:', err.message)
  }

  console.log('=== scraper done ===')
}

runScraper()