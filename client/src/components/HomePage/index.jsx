const HOW_IT_WORKS = [
  { step: '01', title: 'Pick your stack',   desc: 'Search from 80+ skills. Synonyms handled — React finds reactjs, react.js and more.' },
  { step: '02', title: 'Set your terms',    desc: 'Salary, experience, job type. Stretch roles still surface if skills match well.' },
  { step: '03', title: 'Apply with clarity', desc: 'Visa status, ATS platform and match score shown on every card before you click.' },
]

const SKILLS_FLOAT = ['React', 'Node.js', 'Python', 'TypeScript', 'Go', 'AWS', 'Docker', 'GraphQL', 'Next.js', 'Rust', 'PostgreSQL']

export default function HomePage({ onSearch, onViewAll }) {
  return (
    <div className="h-full flex flex-col overflow-hidden select-none">

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-between p-14 relative">

        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--text-mute)' }}>
            US · Remote · 2025
          </span>
          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--text-mute)' }}>
            v1.0
          </span>
        </div>

        <div className="flex flex-col gap-6">
          <h2
            className="uppercase leading-[0.88] tracking-tight"
            style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(4rem, 8vw, 7rem)', color: 'var(--text)' }}
          >
            Find work<br />
            <span style={{ color: 'var(--text-mute)' }}>that </span>
            <span style={{ color: 'var(--lime)' }}>fits.</span>
          </h2>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Primary: filter-based search */}
            <button
              onClick={onSearch}
              className="px-7 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-opacity"
              style={{ background: 'var(--lime)', color: 'var(--lime-dark)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Search with filters →
            </button>

            {/* Secondary: browse everything recent */}
            <button
              onClick={onViewAll}
              className="px-7 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all"
              style={{
                border: '1px solid var(--border-2)',
                color: 'var(--text-dim)',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-3)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-2)'
                e.currentTarget.style.color = 'var(--text-dim)'
              }}
            >
              View all jobs
            </button>

            <span className="text-sm w-full" style={{ color: 'var(--text-mute)' }}>
              ← configure filters first, or browse all recent openings
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {SKILLS_FLOAT.map((skill, i) => (
            <span
              key={skill}
              className="px-3 py-1 rounded-full text-xs"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-dim)',
                opacity: Math.max(0.2, 1 - i * 0.07),
              }}
            >
              {skill}
            </span>
          ))}
          <span
            className="px-3 py-1 rounded-full text-xs"
            style={{ border: '1px solid var(--border)', color: 'var(--text-mute)' }}
          >
            +70 more
          </span>
        </div>

        {/* Decorative line */}
        <div className="absolute right-14 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }} />
        <div
          className="absolute right-14 top-1/2 w-2 h-2 rounded-full -translate-y-1/2"
          style={{ background: 'var(--lime)', transform: 'translate(-3px, -50%)' }}
        />
      </div>

      {/* How it works */}
      <div className="shrink-0 grid grid-cols-3" style={{ borderTop: '1px solid var(--border)' }}>
        {HOW_IT_WORKS.map((item, i) => (
          <div
            key={item.step}
            className="px-8 py-6 flex gap-4 items-start"
            style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}
          >
            <span
              className="text-3xl shrink-0 leading-none mt-0.5"
              style={{ fontFamily: 'Bebas Neue', color: 'var(--text-mute)' }}
            >
              {item.step}
            </span>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{item.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}