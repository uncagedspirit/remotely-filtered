import { useState, useRef, useEffect } from 'react'
import { useFilterStore } from '../../store/filterStore'
import { ALL_SKILLS } from '../../utils/synonyms'

const JOB_TYPES = ['any', 'full-time', 'contract', 'part-time']

function SkillSearch({ selected, onAdd, onRemove }) {
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)
  const inputRef            = useRef()
  const dropdownRef         = useRef()

  const filtered = ALL_SKILLS
    .filter(s => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s))
    .slice(0, 12)

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (skill) => {
    onAdd(skill)
    setQuery('')
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0])
    if (e.key === 'Backspace' && query === '' && selected.length > 0) onRemove(selected[selected.length - 1])
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {selected.map(skill => (
            <span
              key={skill}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded text-xs"
              style={{
                background: 'rgba(163,230,53,0.08)',
                color: 'var(--lime)',
                border: '1px solid var(--border-2)',
              }}
            >
              {skill}
              <button
                onClick={() => onRemove(skill)}
                className="cursor-pointer leading-none ml-0.5 hover:opacity-100 opacity-50 transition-opacity"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-text transition-colors"
        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={selected.length === 0 ? 'Search or browse skills...' : 'Add more...'}
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: 'var(--text)', caretColor: 'var(--lime)' }}
        />
        <button
          onClick={e => { e.stopPropagation(); setOpen(!open) }}
          className="cursor-pointer transition-transform shrink-0"
          style={{ color: 'var(--text-dim)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
        >
          {query === '' && (
            <p className="px-3 pt-3 pb-1 text-xs tracking-widest uppercase" style={{ color: 'var(--text-mute)' }}>
              All skills
            </p>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(skill => (
              <button
                key={skill}
                onMouseDown={() => handleSelect(skill)}
                className="w-full text-left px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors group"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-4)'
                  e.currentTarget.style.color = 'var(--lime)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-dim)'
                }}
              >
                {skill}
                <span className="text-xs opacity-40">+ add</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="py-5 px-7" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-mute)' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function Stepper({ value, onChange, min = 0, max = 10 }) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg text-lg leading-none cursor-pointer transition-colors flex items-center justify-center"
        style={{ border: '1px solid var(--border-2)', color: 'var(--text-dim)', background: 'var(--bg-3)' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
      >
        −
      </button>
      <span className="text-sm font-medium w-16 text-center" style={{ color: 'var(--text)' }}>
        {value === 0 ? 'Any' : `${value}yr+`}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg text-lg leading-none cursor-pointer transition-colors flex items-center justify-center"
        style={{ border: '1px solid var(--border-2)', color: 'var(--text-dim)', background: 'var(--bg-3)' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
      >
        +
      </button>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={onChange}
        className="w-9 h-5 rounded-full relative cursor-pointer transition-colors shrink-0"
        style={{ background: checked ? 'var(--lime)' : 'var(--bg-4)' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{ background: 'var(--text)', left: checked ? '17px' : '2px' }}
        />
      </div>
      <span className="text-sm transition-colors" style={{ color: 'var(--text-dim)' }}>
        {label}
      </span>
    </label>
  )
}

export default function FilterPanel({ onSearch }) {
  const {
    skills, setSkills,
    experience, setExperience,
    jobType, setJobType,
    salaryMin, setSalaryMin,
    salaryMax, setSalaryMax,
    keyword, setKeyword,
    visaSponsorship, setVisaSponsorship,
    reset,
  } = useFilterStore()

  const addSkill    = (s) => { if (!skills.includes(s)) setSkills([...skills, s]) }
  const removeSkill = (s) => setSkills(skills.filter(x => x !== s))

  const inputStyle = {
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text)',
    padding: '8px 12px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    caretColor: 'var(--lime)',
  }

  return (
    <div className="flex flex-col">

      <Section label="Skills">
        <SkillSearch selected={skills} onAdd={addSkill} onRemove={removeSkill} />
      </Section>

      <Section label="Experience">
        <Stepper value={experience} onChange={setExperience} min={0} max={10} />
      </Section>

      <Section label="Job Type">
        <div className="flex flex-col gap-1">
          {JOB_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setJobType(type)}
              className="text-left text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer capitalize"
              style={{
                background: jobType === type ? 'rgba(163,230,53,0.08)' : 'transparent',
                color: jobType === type ? 'var(--lime)' : 'var(--text-dim)',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Salary / yr (USD)">
        <div className="flex gap-2">
          {[
            { label: 'Min', value: salaryMin, onChange: setSalaryMin, placeholder: '60,000' },
            { label: 'Max', value: salaryMax, onChange: setSalaryMax, placeholder: 'any' },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label} className="flex-1">
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-mute)' }}>{label}</p>
              <div
                className="flex items-center px-3 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}
              >
                <span className="text-sm mr-1" style={{ color: 'var(--text-mute)' }}>$</span>
                <input
                  type="number"
                  value={value ?? ''}
                  onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
                  placeholder={placeholder}
                  className="bg-transparent text-sm outline-none w-full"
                  style={{ color: 'var(--text)', caretColor: 'var(--lime)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Keyword">
        <input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="fintech, startup, TypeScript..."
          style={inputStyle}
        />
      </Section>

      <Section label="Visa">
        <Toggle
          checked={visaSponsorship}
          onChange={() => setVisaSponsorship(!visaSponsorship)}
          label="Show jobs with no sponsorship"
        />
      </Section>

      <div className="px-7 py-5 flex gap-2">
        <button
          onClick={reset}
          className="px-4 py-2.5 text-xs rounded-lg cursor-pointer transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          Reset
        </button>
        <button
          onClick={onSearch}
          className="flex-1 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-colors"
          style={{ background: 'var(--lime)', color: 'var(--lime-dark)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Search →
        </button>
      </div>

    </div>
  )
}