import { useState, useEffect, useRef, useCallback } from 'react'
import StatusPill from './StatusPill'
import './AddLeadModal.css'

const WEBHOOK_EXTRACT    = 'https://saudamini9.app.n8n.cloud/webhook/e5fed7f2-cf80-412d-b828-a9d589a576fe'
const WEBHOOK_SAVE       = 'https://saudamini9.app.n8n.cloud/webhook/211fe521-2b65-4282-bb68-cfc62bfe0aad'
const WEBHOOK_TRANSCRIBE = 'https://saudamini9.app.n8n.cloud/webhook/28a72db4-7fea-41db-ac91-a043897e9005'

const STATUSES = ['hot', 'warm', 'cold', 'nurturing', 'post-close', 'other']

const EMPTY_FORM = {
  lead_name: '',
  lead_spouse_name: '',
  lead_children_info: '',
  lead_email: '',
  lead_budget: '',
  lead_status: 'cold',
  lead_notes: '',
  lead_occupation: '',
  lead_spouse_occupation: '',
  lead_bedrooms: '',
  lead_bathrooms: '',
  lead_neighborhoods: '',
  lead_work_location: '',
  lead_spouse_work_location: '',
}

// n8n sometimes returns the string "null" instead of actual null
function clean(val) {
  if (val === null || val === undefined || val === 'null') return ''
  return String(val)
}

export default function AddLeadModal({ onClose, onSaved, onDraftChange }) {
  const [tab, setTab] = useState('quick')
  const [freeText, setFreeText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceError, setVoiceError] = useState(null)
  const textareaRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordingStartRef = useRef(null)

  useEffect(() => {
    onDraftChange(form ? (form.lead_name || '') : null)
  }, [form?.lead_name, form === null])

  useEffect(() => {
    if (tab === 'quick' && !form && textareaRef.current) textareaRef.current.focus()
  }, [tab, form])

  function handleTabChange(t) {
    setTab(t)
    setExtractError(null)
    if (t === 'manual' && !form) setForm({ ...EMPTY_FORM })
    if (t === 'quick') { setForm(null) }
  }

  async function handleExtract() {
    if (!freeText.trim()) return
    setExtracting(true)
    setExtractError(null)
    try {
      const res = await fetch(WEBHOOK_EXTRACT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: freeText.trim() }),
      })
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`)
      const data = await res.json()
      const raw = Array.isArray(data) ? data[0] : data
      setForm({
        lead_name:                clean(raw.lead_name),
        lead_spouse_name:         clean(raw.lead_spouse_name),
        lead_children_info:       clean(raw.lead_children_info),
        lead_email:               clean(raw.lead_email),
        lead_budget:              raw.lead_budget != null && raw.lead_budget !== 'null'
                                    ? String(raw.lead_budget) : '',
        lead_status:              raw.lead_status && raw.lead_status !== 'null'
                                    ? raw.lead_status : 'cold',
        lead_notes:               clean(raw.lead_notes),
        lead_occupation:          clean(raw.lead_occupation),
        lead_spouse_occupation:   clean(raw.lead_spouse_occupation),
        lead_bedrooms:            raw.lead_bedrooms != null && raw.lead_bedrooms !== 'null'
                                    ? String(raw.lead_bedrooms) : '',
        lead_bathrooms:           raw.lead_bathrooms != null && raw.lead_bathrooms !== 'null'
                                    ? String(raw.lead_bathrooms) : '',
        lead_neighborhoods:       clean(raw.lead_neighborhoods),
        lead_work_location:       clean(raw.lead_work_location),
        lead_spouse_work_location: clean(raw.lead_spouse_work_location),
      })
    } catch (err) {
      setExtractError(err.message || 'Failed to extract. Try again.')
    } finally {
      setExtracting(false)
    }
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = [{
        lead_name:                form.lead_name                || null,
        lead_spouse_name:         form.lead_spouse_name         || null,
        lead_children_info:       form.lead_children_info       || null,
        lead_email:               form.lead_email               || null,
        lead_budget:              form.lead_budget ? parseFloat(form.lead_budget) : null,
        lead_status:              form.lead_status              || 'other',
        lead_notes:               form.lead_notes               || null,
        lead_occupation:          form.lead_occupation          || null,
        lead_spouse_occupation:   form.lead_spouse_occupation   || null,
        lead_bedrooms:            form.lead_bedrooms ? parseInt(form.lead_bedrooms) : null,
        lead_bathrooms:           form.lead_bathrooms ? parseFloat(form.lead_bathrooms) : null,
        lead_neighborhoods:       form.lead_neighborhoods       || null,
        lead_work_location:       form.lead_work_location       || null,
        lead_spouse_work_location: form.lead_spouse_work_location || null,
      }]
      const res = await fetch(WEBHOOK_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      const data = await res.json()
      const saved = Array.isArray(data) ? data[0] : data
      onSaved(saved)
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Try again.')
      setSaving(false)
    }
  }

  async function startRecording() {
    setVoiceError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const duration = Date.now() - recordingStartRef.current
        if (duration < 1500) {
          setTranscribing(false)
          setVoiceError('Recording too short — please speak for at least a second.')
          return
        }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      recordingStartRef.current = Date.now()
      setRecording(true)
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError('Microphone access is required for voice input.')
      } else {
        setVoiceError('Could not start recording. Please try again.')
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setTranscribing(true)
    }
  }

  async function transcribeAudio(blob) {
    try {
      const formData = new FormData()
      formData.append('data', blob, 'recording.webm')
      const res = await fetch(WEBHOOK_TRANSCRIBE, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Transcription failed (${res.status})`)
      const data = await res.json()
      const raw = Array.isArray(data) ? data[0] : data
      // n8n Respond to Webhook can wrap the body in an "output" string — parse it if so
      const result = typeof raw.output === 'string' ? JSON.parse(raw.output) : raw
      if (result.valid === true && result.text) {
        setFreeText(prev => prev ? prev + ' ' + result.text : result.text)
      } else if (result.valid === false) {
        setVoiceError(result.error || 'Transcription failed, please try again or type manually.')
      } else {
        throw new Error('Unexpected response format')
      }
    } catch {
      setVoiceError('Transcription failed, please try again or type manually.')
    } finally {
      setTranscribing(false)
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add new lead">

        <div className="modal-header">
          <h2 className="modal-title">Add New Lead</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'quick' ? 'active' : ''}`} onClick={() => handleTabChange('quick')}>
            ⚡ Quick Add
          </button>
          <button className={`modal-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => handleTabChange('manual')}>
            📋 Manual Entry
          </button>
        </div>

        <div className="modal-body">

          {/* ── Quick Add: free text ── */}
          {tab === 'quick' && !form && (
            <div className="quick-add">
              <p className="quick-hint">
                Describe the lead in plain English — name, budget, status, anything you know.
              </p>
              <div className="textarea-wrap">
                <textarea
                  ref={textareaRef}
                  className="quick-textarea"
                  placeholder='e.g. "Just met Sarah at Buckhead open house, budget $750K, hot lead, husband Tom, two kids"'
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  rows={5}
                  disabled={recording || transcribing}
                />
                <button
                  className={`mic-btn ${recording ? 'mic-btn--recording' : ''}`}
                  onClick={recording ? stopRecording : startRecording}
                  disabled={transcribing}
                  aria-label={recording ? 'Stop recording' : 'Start voice recording'}
                  title={recording ? 'Stop recording' : 'Record voice note'}
                >
                  {transcribing ? (
                    <span className="spinner spinner--dark" />
                  ) : recording ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <rect x="4" y="4" width="16" height="16" rx="2"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/>
                      <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>

              {recording && (
                <div className="voice-status recording">
                  <span className="voice-dot" /> Recording…
                </div>
              )}
              {transcribing && (
                <div className="voice-status transcribing">
                  <span className="spinner spinner--dark" /> Transcribing…
                </div>
              )}
              {voiceError && <p className="form-error">{voiceError}</p>}
              {extractError && <p className="form-error">{extractError}</p>}
              <button
                className="btn-primary"
                onClick={handleExtract}
                disabled={extracting || transcribing || recording || !freeText.trim()}
              >
                {extracting ? <><span className="spinner" /> Extracting…</> : 'Extract Fields →'}
              </button>
            </div>
          )}

          {/* ── Draft form ── */}
          {form && (
            <div className="draft-form">
              {tab === 'quick' && (
                <button className="back-link" onClick={() => setForm(null)}>
                  ← Back to free text
                </button>
              )}

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Lead Name</label>
                  <input className="form-input" value={form.lead_name}
                    onChange={e => setField('lead_name', e.target.value)} placeholder="Full name" />
                </div>

                <div className="form-field">
                  <label className="form-label">Spouse / Partner</label>
                  <input className="form-input" value={form.lead_spouse_name}
                    onChange={e => setField('lead_spouse_name', e.target.value)} placeholder="Partner name" />
                </div>

                <div className="form-field">
                  <label className="form-label">Children</label>
                  <input className="form-input" value={form.lead_children_info}
                    onChange={e => setField('lead_children_info', e.target.value)} placeholder="e.g. 2 kids, ages 4 and 7" />
                </div>

                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.lead_email}
                    onChange={e => setField('lead_email', e.target.value)} placeholder="e.g. jane@gmail.com" />
                </div>

                <div className="form-field">
                  <label className="form-label">Budget ($)</label>
                  <input className="form-input" type="number" value={form.lead_budget}
                    onChange={e => setField('lead_budget', e.target.value)} placeholder="750000" />
                </div>

                <div className="form-field">
                  <label className="form-label">Lead Occupation</label>
                  <input className="form-input" value={form.lead_occupation}
                    onChange={e => setField('lead_occupation', e.target.value)} placeholder="e.g. Software Engineer" />
                </div>

                <div className="form-field">
                  <label className="form-label">Spouse Occupation</label>
                  <input className="form-input" value={form.lead_spouse_occupation}
                    onChange={e => setField('lead_spouse_occupation', e.target.value)} placeholder="e.g. Teacher" />
                </div>

                <div className="form-field">
                  <label className="form-label">Lead Work Location</label>
                  <input className="form-input" value={form.lead_work_location}
                    onChange={e => setField('lead_work_location', e.target.value)} placeholder="e.g. Midtown Atlanta" />
                </div>

                <div className="form-field">
                  <label className="form-label">Spouse Work Location</label>
                  <input className="form-input" value={form.lead_spouse_work_location}
                    onChange={e => setField('lead_spouse_work_location', e.target.value)} placeholder="e.g. Buckhead" />
                </div>

                <div className="form-field">
                  <label className="form-label">Bedrooms</label>
                  <input className="form-input" type="number" value={form.lead_bedrooms}
                    onChange={e => setField('lead_bedrooms', e.target.value)} placeholder="e.g. 3" />
                </div>

                <div className="form-field">
                  <label className="form-label">Bathrooms</label>
                  <input className="form-input" type="number" value={form.lead_bathrooms}
                    onChange={e => setField('lead_bathrooms', e.target.value)} placeholder="e.g. 2" />
                </div>

                <div className="form-field form-field--full">
                  <label className="form-label">Neighborhoods / Areas / Zip Codes</label>
                  <input className="form-input" value={form.lead_neighborhoods}
                    onChange={e => setField('lead_neighborhoods', e.target.value)} placeholder="e.g. Sandy Springs, Buckhead, 30328" />
                </div>

                <div className="form-field form-field--full">
                  <label className="form-label">Lead Status</label>
                  <div className="status-options">
                    {STATUSES.map(s => (
                      <button key={s} type="button"
                        className={`status-option ${form.lead_status === s ? 'selected' : ''}`}
                        onClick={() => setField('lead_status', s)}>
                        <StatusPill status={s} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field form-field--full">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.lead_notes}
                    onChange={e => setField('lead_notes', e.target.value)}
                    placeholder="Any additional context…" rows={3} />
                </div>
              </div>

              {saving && (
                <div className="saving-notice">
                  <span className="spinner spinner--dark" /> Saving lead and generating AI summary…
                </div>
              )}

              {saveError && <p className="form-error">{saveError}</p>}

              <div className="form-actions">
                <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : 'Save Lead'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
