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
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  function copyToClipboard() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

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
          {value && (
            <button className="edit-email-btn" onClick={copyToClipboard} aria-label="Copy email">
              {copied ? (
                <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
                  <path d="M4 10l4 4 8-8" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
                  <rect x="7" y="7" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M13 7V5a1.5 1.5 0 00-1.5-1.5h-6A1.5 1.5 0 004 5v6A1.5 1.5 0 005.5 12.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )}
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

function NotesField({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
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
    setSaving(true)
    setError(null)
    const err = await onSave(draft.trim() || null)
    setSaving(false)
    if (err) setError(err)
    else setEditing(false)
  }

  return (
    <div className="notes-block">
      {editing ? (
        <>
          <textarea
            ref={textareaRef}
            className="notes-edit-textarea"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={5}
            disabled={saving}
            placeholder="Add notes…"
          />
          {error && <p className="notes-edit-error">{error}</p>}
          <div className="notes-edit-actions">
            <button className="email-btn email-btn--ghost" onClick={cancel} disabled={saving}>Cancel</button>
            <button className="email-btn email-btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <div className="notes-display">
          {value
            ? <p className="notes-text">{value}</p>
            : <p className="notes-empty">No notes yet.</p>
          }
          <button className="edit-email-btn notes-edit-btn" onClick={startEdit} aria-label="Edit notes">
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

const WEBHOOK_TTS = 'https://saudamini9.app.n8n.cloud/webhook/310cde80-f2b1-4407-acfc-eaf1ff5b1a4c'

function SpeakButton({ summary }) {
  const [state, setState] = useState('idle') // idle | loading | playing
  const [error, setError] = useState(null)
  const audioRef = useRef(null)
  const blobUrlRef = useRef(null)

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setState('idle')
  }

  useEffect(() => () => stop(), [])

  async function handleClick() {
    if (state === 'playing') { stop(); return }
    if (state === 'loading') return
    if (!summary) return

    setError(null)
    setState('loading')
    try {
      const res = await fetch(WEBHOOK_TTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summary }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const raw = await res.blob()
      const blob = new Blob([raw], { type: 'audio/mp3' })
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => stop()
      audio.onerror = () => { setError('Could not generate audio, please try again.'); stop() }
      await audio.play()
      setState('playing')
    } catch {
      setError('Could not generate audio, please try again.')
      setState('idle')
    }
  }

  return (
    <div className="speak-wrap">
      <button
        className={`speak-btn speak-btn--${state}`}
        onClick={handleClick}
        disabled={!summary}
        aria-label={state === 'playing' ? 'Stop audio' : 'Read summary aloud'}
        title={!summary ? 'No AI Summary available' : state === 'playing' ? 'Stop' : 'Read aloud'}
      >
        {state === 'loading' && <span className="spinner spinner--speak" />}
        {state === 'idle' && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
            <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"/>
          </svg>
        )}
        {state === 'playing' && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
            <path d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1H6zm6 0a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1h-2z"/>
          </svg>
        )}
      </button>
      {error && <p className="speak-error">{error}</p>}
    </div>
  )
}

export default function LeadDetail({ lead, onClose, onEmailUpdated, onNotesUpdated, onUpdate }) {
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
        <button className="update-lead-btn" onClick={onUpdate} aria-label="Update lead">
          <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
            <path d="M13.586 3.586a2 2 0 112.828 2.828L8 14.828 4 16l1.172-4L13.586 3.586z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Update
        </button>
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
              <SpeakButton summary={lead.lead_ai_summary} />
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
            <Field label="Lead Occupation" value={lead.lead_occupation} />
            <Field label="Spouse Occupation" value={lead.lead_spouse_occupation} />
            <Field label="Lead Work Location" value={lead.lead_work_location} />
            <Field label="Spouse Work Location" value={lead.lead_spouse_work_location} />
          </div>
        </section>

        <section className="detail-section">
          <h3 className="section-heading">Property Preferences</h3>
          <div className="fields-grid">
            <Field label="Bedrooms" value={lead.lead_bedrooms != null ? String(lead.lead_bedrooms) : null} />
            <Field label="Bathrooms" value={lead.lead_bathrooms != null ? String(lead.lead_bathrooms) : null} />
            <Field label="Neighborhoods / Areas" value={lead.lead_neighborhoods} />
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
          <NotesField value={lead.lead_notes} onSave={onNotesUpdated} />
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
