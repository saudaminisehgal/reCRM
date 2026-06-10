import './Sidebar.css'

const STATUS_CONFIG = {
  cold:       { label: 'Cold',       emoji: '🧊' },
  warm:       { label: 'Warm',       emoji: '☀️' },
  hot:        { label: 'Hot',        emoji: '🔥' },
  nurturing:  { label: 'Nurturing',  emoji: '🌱' },
  'post-close': { label: 'Post-Close', emoji: '✅' },
  other:      { label: 'Other',      emoji: '📌' },
}

export default function Sidebar({ activeFilter, onFilterChange, statusCounts, totalCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">RE</div>
        <span className="brand-name">reCRM</span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-label">Leads</p>

        <button
          className={`nav-item ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          </span>
          <span className="nav-label">All Leads</span>
          <span className="nav-badge">{totalCount}</span>
        </button>

        <p className="nav-section-label" style={{ marginTop: '20px' }}>By Status</p>

        {Object.entries(STATUS_CONFIG).map(([key, { label, emoji }]) => (
          <button
            key={key}
            className={`nav-item ${activeFilter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            <span className="nav-emoji">{emoji}</span>
            <span className="nav-label">{label}</span>
            {statusCounts[key] > 0 && (
              <span className="nav-badge">{statusCounts[key]}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="footer-text">Real Estate CRM</p>
      </div>
    </aside>
  )
}
