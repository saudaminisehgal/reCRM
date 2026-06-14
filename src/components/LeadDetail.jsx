import StatusPill from './StatusPill'
import './LeadDetail.css'

function formatBudget(val) {
  if (!val) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function Field({ label, value, mono, alwaysShow }) {
  if (!value && !alwaysShow) return null
  return (
    <div className="detail-field">
      <p className="field-label">{label}</p>
      <p className={`field-value ${mono ? 'mono' : ''}`}>{value || '—'}</p>
    </div>
  )
}

export default function LeadDetail({ lead, onClose }) {
  return (
    <div className="lead-detail">
      <div className="detail-header">
        <div className="detail-avatar">{getInitials(lead.lead_name)}</div>
        <div className="detail-title-block">
          <h2 className="detail-name">{lead.lead_name || 'Unnamed Lead'}</h2>
          <StatusPill status={lead.lead_status} size="md" />
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close detail panel">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="detail-body">
        {lead.lead_ai_summary && (
          <div className="summary-card">
            <p className="summary-label">
              <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              AI Summary
            </p>
            <p className="summary-text">{lead.lead_ai_summary}</p>
          </div>
        )}

        <section className="detail-section">
          <h3 className="section-heading">People</h3>
          <div className="fields-grid">
            <Field label="Lead Name" value={lead.lead_name} />
            <Field label="Spouse / Partner" value={lead.lead_spouse_name} />
            <Field label="Children" value={lead.lead_children_info} />
            <Field label="Email" value={lead.lead_email} alwaysShow />
          </div>
        </section>

        <section className="detail-section">
          <h3 className="section-heading">Financial</h3>
          <div className="fields-grid">
            <Field label="Budget" value={formatBudget(lead.lead_budget)} />
          </div>
        </section>

        <section className="detail-section">
          <h3 className="section-heading">Notes</h3>
          <div className="notes-block">
            {lead.lead_notes
              ? <p className="notes-text">{lead.lead_notes}</p>
              : <p className="notes-empty">No notes yet.</p>
            }
          </div>
        </section>

        <section className="detail-section">
          <h3 className="section-heading">Meta</h3>
          <div className="fields-grid">
            <Field label="Lead ID" value={String(lead.id)} mono />
            <Field label="Added On" value={formatDate(lead.created_at)} />
          </div>
        </section>
      </div>
    </div>
  )
}
