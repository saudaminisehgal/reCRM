import StatusPill from './StatusPill'
import './LeadList.css'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatBudget(val) {
  if (!val) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LeadList({ leads, loading, error, selectedId, onSelect, onRetry }) {
  if (loading) {
    return (
      <div className="lead-list">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="lead-card skeleton">
            <div className="skeleton-avatar" />
            <div className="skeleton-lines">
              <div className="skeleton-line" style={{ width: '55%' }} />
              <div className="skeleton-line" style={{ width: '35%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="lead-list-empty">
        <p className="empty-icon">⚠️</p>
        <p className="empty-title">Could not load leads</p>
        <p className="empty-sub">{error}</p>
        <button className="retry-btn" onClick={onRetry}>Retry</button>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="lead-list-empty">
        <p className="empty-icon">🔍</p>
        <p className="empty-title">No leads found</p>
        <p className="empty-sub">Try adjusting the filter or search term.</p>
      </div>
    )
  }

  return (
    <div className="lead-list">
      {leads.map(lead => (
        <button
          key={lead.id}
          className={`lead-card ${selectedId === lead.id ? 'selected' : ''}`}
          onClick={() => onSelect(lead)}
        >
          <div className="lead-avatar" aria-hidden="true">
            {getInitials(lead.lead_name)}
          </div>
          <div className="lead-info">
            <div className="lead-top-row">
              <span className="lead-name">{lead.lead_name || 'Unnamed Lead'}</span>
              <StatusPill status={lead.lead_status} />
            </div>
            <div className="lead-meta">
              {lead.lead_spouse_name && (
                <span className="meta-chip">+ {lead.lead_spouse_name}</span>
              )}
              {lead.lead_budget && (
                <span className="meta-chip budget">{formatBudget(lead.lead_budget)}</span>
              )}
              <span className="meta-date">{formatDate(lead.created_at)}</span>
            </div>
            {lead.lead_ai_summary && (
              <p className="lead-summary">{lead.lead_ai_summary}</p>
            )}
          </div>
          <svg className="lead-chevron" viewBox="0 0 20 20" fill="none">
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ))}
    </div>
  )
}
