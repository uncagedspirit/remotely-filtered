require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const express   = require('express')
const cors      = require('cors')
const jobsRoute = require('./routes/jobs')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/jobs', jobsRoute)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`[api] running on http://localhost:${PORT}`)
})