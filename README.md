# Remotely Filtered

> Remote jobs, filtered for you.

A full-stack job board that scrapes remote job listings from multiple sources, scores them against your skills, and surfaces the best matches with visa sponsorship and salary transparency.

**Live:** https://remotely-filtered.vercel.app

## Screenshots

<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/622b4a4b-5fb5-438a-b629-e752b3051812" />

<img width="1919" height="913" alt="image" src="https://github.com/user-attachments/assets/1d6a3ffc-835b-4c0a-bbdf-2fc981c52ca0" />



---

## What It Does

Most job boards show you everything. This one filters first. You pick your stack, set your salary floor, experience level, and job type — and only jobs that actually match surface. Every card shows visa sponsorship status, salary range, and a match score before you click through.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Vercel                          │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │   React Frontend  │    │  Serverless Function   │ │
│  │   (client/dist)   │───▶│   (api/jobs.js)        │ │
│  └──────────────────┘    └──────────┬─────────────┘ │
└─────────────────────────────────────┼───────────────┘
                                      │ HTTP
                                      ▼
                              ┌───────────────┐
                              │  Turso (libSQL)│
                              │  hosted SQLite │
                              └───────────────┘
                                      ▲
                              ┌───────────────┐
                              │    Scraper     │
                              │ (runs locally) │
                              └───────────────┘
```

The monorepo has three packages:

| Package | Role |
|---|---|
| `client/` | React + Vite frontend |
| `packages/api/` | Express server (local dev only) |
| `packages/scraper/` | Job scraper, runs on a cron or manually |
| `api/jobs.js` | Vercel serverless function (production) |

---

## Tech Stack

**Frontend**
- React 19 with Vite 8
- TanStack Query for server state and caching
- Zustand for client-side filter state
- Tailwind CSS v4 for styling
- Axios for HTTP

**Backend**
- Vercel Serverless Functions (production)
- Express.js (local development)
- Turso (hosted libSQL / SQLite) as the database
- No ORM — raw SQL

**Scraper**
- Node.js with Axios for HTTP scraping
- Five job sources: Remotive, RemoteOK, Arbeitnow, Jobicy, Himalayas
- node-cron for scheduled runs
- Puppeteer + puppeteer-extra-plugin-stealth for JS-rendered sources

---

## Data Pipeline

### 1. Scraping

The scraper hits five public job APIs and normalizes everything into a common shape:

```
Raw source data → normalizeJob() → upsertJobs() → Turso DB
```

Each source has its own adapter in `packages/scraper/src/sources/`. They handle source-specific quirks — Remotive gives monthly salaries sometimes, RemoteOK has noise tags, Himalayas has location restriction arrays, etc.

The `normalizeJob()` function:
- Strips HTML from descriptions
- Parses salary strings into `salary_min` / `salary_max` numbers
- Extracts years of experience from description text using regex patterns
- Detects US-only and no-visa-sponsorship signals via keyword matching
- Flags jobs older than 7 days as `is_stale`

Jobs older than 7 days are pruned on every scraper run.

### 2. Storage

Single SQLite table via Turso:

```sql
CREATE TABLE jobs (
  id               TEXT PRIMARY KEY,
  title            TEXT,
  company          TEXT,
  description      TEXT,
  url              TEXT,
  salary_min       REAL,
  salary_max       REAL,
  salary_raw       TEXT,
  skills           TEXT,        -- JSON array
  job_type         TEXT,
  experience_min   INTEGER,
  posted_at        INTEGER,     -- Unix ms
  scraped_at       INTEGER,     -- Unix ms
  source           TEXT,
  visa_sponsorship INTEGER DEFAULT 1,
  us_only          INTEGER DEFAULT 0,
  is_stale         INTEGER DEFAULT 0
)
```

Upserts are used so re-running the scraper refreshes staleness and salary data without creating duplicates.

### 3. API / Filtering

The serverless function at `api/jobs.js`:

1. Applies SQL-level filters (job type, salary min, experience, visa) to reduce the dataset
2. Scores every remaining job against selected skills (0–100%)
3. Hard-filters: job must match at least one selected skill in title or skill tags — description matches alone are rejected to avoid false positives
4. Applies keyword search across title, company, description
5. Applies salary max filter
6. Sorts by match score descending, then by recency
7. Separately surfaces a "just in case" section — jobs below salary target but with strong skill match (≥50%)

### 4. Skill Matching

Skills use a synonym map so selecting "React" also matches `reactjs`, `react.js`, `react js`. Matching uses word-boundary regex so "go" doesn't match "django".

Match score = `(matched skills / total selected skills) * 100`

---

## Frontend

Three modes:

- **home** — landing page explaining the product
- **all** — all recent jobs, no filters applied
- **search** — filtered results using the filter panel state

State is managed with Zustand in `filterStore.js`. The filter panel drives the store, and `useJobs` hook reads from it, passing filters as query params. TanStack Query handles caching and refetching.

The skill search component supports typeahead, keyboard navigation (Enter to add first result, Backspace to remove last tag, Escape to close), and multi-select with pill display.

---

## Running Locally

**Prerequisites:** Node 20+, a Turso account

```bash
# Install dependencies
npm install

# Create .env at project root
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Run the scraper to populate the DB
npm run scrape

# Start dev servers (API on :3001, client on :5173)
npm run dev
```

**Scraper commands:**
```bash
npm run scrape      # run once
npm run schedule    # run on cron (daily at 06:00)
```

---

## Deployment

Frontend and API are both deployed on Vercel.

The `api/jobs.js` file at the project root is picked up as a Vercel Serverless Function. The `vercel.json` tells Vercel to build the client and route `/api/*` to the function.

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

The function talks to Turso over HTTP using the `/v2/pipeline` endpoint — no native packages, no binary dependencies, works cleanly in a serverless environment.

The scraper runs locally or on any machine with the env vars set. There is no hosted scraper — you run it manually or set up your own cron.

---

## Project Structure

```
remotely-filtered/
├── api/
│   └── jobs.js               # Vercel serverless function
├── client/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── FilterPanel/
│       │   ├── HomePage/
│       │   └── JobList/
│       ├── hooks/
│       │   └── useJobs.js
│       ├── store/
│       │   └── filterStore.js
│       └── utils/
│           └── synonyms.js
├── packages/
│   ├── api/                  # Local Express server
│   │   └── src/
│   │       ├── index.js
│   │       ├── routes/jobs.js
│   │       └── utils/
│   │           ├── db.js
│   │           └── score.js
│   └── scraper/
│       └── src/
│           ├── index.js
│           ├── scheduler.js
│           ├── sources/
│           │   ├── remotive.js
│           │   ├── remoteok.js
│           │   ├── arbeitnow.js
│           │   ├── jobicy.js
│           │   └── himalayas.js
│           └── utils/
│               ├── db.js
│               └── normalize.js
└── vercel.json
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `TURSO_URL` | Vercel + local `.env` | libsql URL from Turso dashboard |
| `TURSO_AUTH_TOKEN` | Vercel + local `.env` | Auth token from `turso db tokens create` |

---

## Limitations & Known Issues

- The scraper must be run manually or self-hosted on a cron — there is no automated pipeline
- Salary data is inconsistently available across sources
- Experience parsing is regex-based and occasionally wrong
- RemoteOK rate-limits aggressively; the scraper may get fewer results on repeat runs
- Jobs with no visa sponsorship info default to `visa_sponsorship = true` (optimistic)
