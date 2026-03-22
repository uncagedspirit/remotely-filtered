import { useState } from 'react'
import FilterPanel from './components/FilterPanel'
import HomePage from './components/HomePage'
import { useFilterStore } from './store/filterStore'

export default function App() {
  const [hasSearched, setHasSearched] = useState(false)
  const filters = useFilterStore()

  const handleSearch = () => {
    console.log('searching with:', filters)
    setHasSearched(true)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      <aside
        className="w-[33%] h-screen flex flex-col shrink-0 overflow-y-auto"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-2)' }}
      >
        <div className="px-7 py-8" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1
            className="text-3xl tracking-widest uppercase"
            style={{ fontFamily: 'Bebas Neue', color: 'var(--lime)' }}
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

      <main
        className="flex-1 h-screen overflow-y-auto"
        style={{ background: 'var(--bg)' }}
      >
        {hasSearched
          ? <p className="p-10 text-sm" style={{ color: 'var(--text-dim)' }}>Results coming soon...</p>
          : <HomePage onSearch={handleSearch} />
        }
      </main>

    </div>
  )
}