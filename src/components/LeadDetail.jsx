import { useState, useRef, useEffect } from 'react'
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

function EmailField({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit() {
    setDraft(value || '')
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
  }

  async function save() {
    const trimmed = draft.trim()
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setSaving(true)
    setError(null)
    const err = await onSave(trimmed || null)
    setSaving(false)
    if (err) {
      setError(err)
    } else {
      setEditing(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  return (
    <div className="detail-field email-field">
      <p className="field-label">Email</p>
      {editing ? (
        <div className="email-edit-wrap">
          <input
            ref={inputRef}
            className={`email-input ${error ? 'email-input--error' : ''}`}
            type="email"
            value={draft}
            onChange={e => { setDraft(e.target.value); setError(null) }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. jane@gmail.com"
            disabled={saving}
          />
          {error && <p className="email-error">{error}</p>}
          <div className="email-actions">
            <button className="email-btn email-btn--ghost" onClick={cancel} disabled={saving}>Cancel</button>
            <button className="email-btn email-btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="email-display">
          <p className="field-value">{value || '—'}</p>
          <button className="edit-email-btn" onClick={startEdit} aria-label="Edit email">
            <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
              <path d="M13.586 3.586a2 2 0 112.828 2.828L8 14.828 4 16l1.172-4L13.586 3.586z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default function LeadDetail({ lead, onClose, onEmailUpdated }) {
  return (
    <div className="lead-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={onClose} aria-label="Back to leads list">
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
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
            <EmailField value={lead.lead_email} onSave={onEmailUpdated} />
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
