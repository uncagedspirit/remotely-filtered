import { useState } from 'react'
import FilterPanel from './components/FilterPanel'
import HomePage from './components/HomePage'
import JobList from './components/JobList'
import { useFilterStore } from './store/filterStore'
import { useJobs } from './hooks/useJobs'

export default function App() {
  // 'home'    → show homepage
  // 'all'     → show all recent jobs, no filter applied yet
  // 'search'  → show filtered results
  const [mode, setMode] = useState('home')

  const filters  = useFilterStore()
  const isActive = mode === 'search' || mode === 'all'

  // When in 'all' mode, pass empty filters so everything comes back
  const activeFilters = mode === 'all'
    ? { skills: [], experience: 0, jobType: 'any', salaryMin: null, salaryMax: null, keyword: '', visaSponsorship: false }
    : filters

  const { data, isLoading, isError } = useJobs(activeFilters, isActive)

  const handleSearch  = () => setMode('search')
  const handleViewAll = () => setMode('all')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <aside
        className="w-[33%] h-screen flex flex-col shrink-0 overflow-y-auto"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-2)' }}
      >
        <div className="px-7 py-8" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1
            className="text-3xl tracking-widest uppercase cursor-pointer"
            style={{ fontFamily: 'Bebas Neue', color: 'var(--lime)' }}
            onClick={() => setMode('home')}
          >
            Remotely
          </h1>
          <p className="mt-1 tracking-wide text-xs" style={{ color: 'var(--text-mute)' }}>
            remote jobs · filtered for you
          </p>
        </div>
        <div className="flex-1">
          <FilterPanel onSearch={handleSearch} />
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto" style={{ background: 'var(--bg)' }}>
        {mode === 'home'
          ? <HomePage onSearch={handleSearch} onViewAll={handleViewAll} />
          : <JobList
              data={data}
              isLoading={isLoading}
              isError={isError}
              mode={mode}
            />
        }
      </main>
    </div>
  )
}