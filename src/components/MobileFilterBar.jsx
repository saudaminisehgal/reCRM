import './MobileFilterBar.css'

const FILTERS = [
  { key: 'all',        label: 'All Leads', emoji: '👥' },
  { key: 'hot',        label: 'Hot',       emoji: '🔥' },
  { key: 'warm',       label: 'Warm',      emoji: '☀️' },
  { key: 'cold',       label: 'Cold',      emoji: '🧊' },
  { key: 'nurturing',  label: 'Nurturing', emoji: '🌱' },
  { key: 'post-close', label: 'Post-Close',emoji: '✅' },
  { key: 'other',      label: 'Other',     emoji: '📌' },
]

export default function MobileFilterBar({ activeFilter, onFilterChange, statusCounts, totalCount }) {
  function getCount(key) {
    return key === 'all' ? totalCount : (statusCounts[key] || 0)
  }

  return (
    <div className="mobile-filter-bar">
      {FILTERS.map(({ key, label, emoji }) => (
        <button
          key={key}
          className={`mfb-pill ${activeFilter === key ? 'active' : ''}`}
          onClick={() => onFilterChange(key)}
        >
          <span>{emoji}</span>
          <span>{label}</span>
          {getCount(key) > 0 && (
            <span className="mfb-count">{getCount(key)}</span>
          )}
        </button>
      ))}
    </div>
  )
}
