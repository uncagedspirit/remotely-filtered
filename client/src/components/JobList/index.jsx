export default function JobList({ data, isLoading, isError }) {
  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm" style={{ color: 'var(--text-mute)' }}>Searching...</p>
    </div>
  )

  if (isError) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm" style={{ color: 'var(--text-mute)' }}>Something went wrong. Is the API running?</p>
    </div>
  )

  if (!data?.results?.length) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm" style={{ color: 'var(--text-mute)' }}>No jobs found. Try different filters.</p>
    </div>
  )

  return (
    <div className="p-8">

      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-mute)' }}>
          {data.results.length} results
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {data.results.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {data.justInCase?.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <p className="text-xs tracking-widest uppercase shrink-0" style={{ color: 'var(--text-mute)' }}>
              below your salary target · strong skill match
            </p>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <div className="grid grid-cols-3 gap-4 opacity-50">
            {data.justInCase.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function JobCard({ job }) {
  const scoreColor = job.match_score >= 70
    ? 'rgba(163,230,53,0.9)'
    : job.match_score >= 40
    ? '#f59e0b'
    : '#6b7280'

  return (
    <div
      className="flex flex-col justify-between p-5 rounded-2xl"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        minHeight: 200,
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug mb-0.5 truncate"
              style={{ color: 'var(--text)' }}
            >
              {job.title}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
              {job.company}
            </p>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
            style={{
              background: 'var(--bg-3)',
              color: scoreColor,
              border: `1px solid ${scoreColor}22`,
            }}
          >
            {job.match_score}%
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(job.skills || []).slice(0, 5).map(skill => (
            <span
              key={skill}
              className="text-xs px-2 py-0.5 rounded-md"
              style={{
                background: 'var(--bg-3)',
                color: 'var(--text-dim)',
                border: '1px solid var(--border)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.is_stale && (
            <span
              className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'var(--bg-3)', color: 'var(--text-mute)', border: '1px solid var(--border)' }}
            >
              possibly stale
            </span>
          )}
          {job.us_only && (
            <span
              className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              US residents only
            </span>
          )}
          {!job.visa_sponsorship && (
            <span
              className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              no sponsorship
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-md"
            style={{ background: 'var(--bg-3)', color: 'var(--text-mute)', border: '1px solid var(--border)' }}
          >
            {job.source}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {job.salary_raw || 'salary not listed'}
          </span>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--lime)', color: 'var(--lime-dark)', fontWeight: 600 }}
            >
              Apply →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}