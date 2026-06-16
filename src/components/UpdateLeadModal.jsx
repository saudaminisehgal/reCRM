import { useState, useRef, useEffect } from 'react'
import StatusPill from './StatusPill'
import './AddLeadModal.css'

const WEBHOOK_EXTRACT    = 'https://saudamini9.app.n8n.cloud/webhook/e5fed7f2-cf80-412d-b828-a9d589a576fe'
const WEBHOOK_SAVE       = 'https://saudamini9.app.n8n.cloud/webhook/211fe521-2b65-4282-bb68-cfc62bfe0aad'
const WEBHOOK_TRANSCRIBE = 'https://saudamini9.app.n8n.cloud/webhook/28a72db4-7fea-41db-ac91-a043897e9005'

const STATUSES = ['hot', 'warm', 'cold', 'nurturing', 'post-close', 'other']

function clean(val) {
  if (val === null || val === undefined || val === 'null') return ''
  return String(val)
}

function fromLead(lead) {
  return {
    lead_name:          clean(lead.lead_name),
    lead_spouse_name:   clean(lead.lead_spouse_name),
    lead_children_info: clean(lead.lead_children_info),
    lead_email:         clean(lead.lead_email),
    lead_budget:        lead.lead_budget != null ? String(lead.lead_budget) : '',
    lead_status:        lead.lead_status || 'cold',
    lead_notes:         clean(lead.lead_notes),
  }
}

export default function UpdateLeadModal({ lead, onClose, onSaved }) {
  const [tab, setTab] = useState('quick')

  // Quick Update tab state
  const [freeText, setFreeText]       = useState('')
  const [extracting, setExtracting]   = useState(false)
  const [extractError, setExtractError] = useState(null)
  const [quickForm, setQuickForm]     = useState(null)

  // Edit Fields tab state — always pre-filled
  const [fieldsForm, setFieldsForm]   = useState(() => fromLead(lead))

  // Shared save state
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState(null)

  // Shared voice state
  const [recording, setRecording]     = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceError, setVoiceError]   = useState(null)

  const textareaRef      = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const recordingStartRef = useRef(null)

  useEffect(() => {
    if (tab === 'quick' && !quickForm && textareaRef.current) textareaRef.current.focus()
  }, [tab, quickForm])

  function handleTabChange(t) {
    setTab(t)
    setExtractError(null)
    setVoiceError(null)
  }

  // Which form is active
  const activeForm = tab === 'quick' ? quickForm : fieldsForm

  function setField(key, val) {
    if (tab === 'quick') setQuickForm(f => ({ ...f, [key]: val }))
    else setFieldsForm(f => ({ ...f, [key]: val }))
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
      // Merge extracted fields over existing lead values — keep existing if nothing extracted
      setQuickForm({
        lead_name:          clean(raw.lead_name)          || clean(lead.lead_name),
        lead_spouse_name:   clean(raw.lead_spouse_name)   || clean(lead.lead_spouse_name),
        lead_children_info: clean(raw.lead_children_info) || clean(lead.lead_children_info),
        lead_email:         clean(raw.lead_email)         || clean(lead.lead_email),
        lead_budget:        raw.lead_budget != null && raw.lead_budget !== 'null'
                              ? String(raw.lead_budget)
                              : lead.lead_budget ? String(lead.lead_budget) : '',
        lead_status:        raw.lead_status && raw.lead_status !== 'null'
                              ? raw.lead_status : (lead.lead_status || 'cold'),
        lead_notes:         clean(raw.lead_notes) || clean(lead.lead_notes),
      })
    } catch (err) {
      setExtractError(err.message || 'Failed to extract. Try again.')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSave() {
    const form = activeForm
    if (!form) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        id:                 lead.id,
        intent:             'update',
        notes_mode:         'append',
        lead_name:          form.lead_name          || null,
        lead_spouse_name:   form.lead_spouse_name   || null,
        lead_children_info: form.lead_children_info || null,
        lead_email:         form.lead_email         || null,
        lead_budget:        form.lead_budget ? parseFloat(form.lead_budget) : null,
        lead_status:        form.lead_status        || 'other',
        lead_notes:         form.lead_notes         || null,
      }
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
      const res = await fetch(WEBHOOK_TRANSCRIBE, { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Transcription failed (${res.status})`)
      const data = await res.json()
      const raw = Array.isArray(data) ? data[0] : data
      const result = typeof raw.output === 'string' ? JSON.parse(raw.output) : raw
      if (result.valid === true && result.text) {
        if (tab === 'quick') {
          // Append to the free text area for later extraction
          setFreeText(prev => prev ? prev + ' ' + result.text : result.text)
        } else {
          // Append transcription to notes field
          setFieldsForm(f => ({
            ...f,
            lead_notes: f.lead_notes ? f.lead_notes + '\n' + result.text : result.text,
          }))
        }
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

  const MicButton = () => (
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
  )

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Update lead">

        <div className="modal-header">
          <h2 className="modal-title">Update Lead</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'quick' ? 'active' : ''}`} onClick={() => handleTabChange('quick')}>
            ⚡ Quick Update
          </button>
          <button className={`modal-tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => handleTabChange('fields')}>
            📋 Edit Fields
          </button>
        </div>

        <div className="modal-body">

          {/* ── Quick Update: free text + extract ── */}
          {tab === 'quick' && !quickForm && (
            <div className="quick-add">
              <p className="quick-hint">
                Describe what changed — speak or type new information about this lead.
              </p>
              <div className="textarea-wrap">
                <textarea
                  ref={textareaRef}
                  className="quick-textarea"
                  placeholder='e.g. "Budget went up to $900K, also looking in Buckhead now"'
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  rows={5}
                  disabled={recording || transcribing}
                />
                <MicButton />
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

          {/* ── Shared form: shown after extract (quick) or always (fields) ── */}
          {(tab === 'fields' || quickForm) && activeForm && (
            <div className="draft-form">
              {tab === 'quick' && quickForm && (
                <button className="back-link" onClick={() => setQuickForm(null)}>
                  ← Back to free text
                </button>
              )}

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Lead Name</label>
                  <input className="form-input" value={activeForm.lead_name}
                    onChange={e => setField('lead_name', e.target.value)} placeholder="Full name" />
                </div>

                <div className="form-field">
                  <label className="form-label">Spouse / Partner</label>
                  <input className="form-input" value={activeForm.lead_spouse_name}
                    onChange={e => setField('lead_spouse_name', e.target.value)} placeholder="Partner name" />
                </div>

                <div className="form-field">
                  <label className="form-label">Children</label>
                  <input className="form-input" value={activeForm.lead_children_info}
                    onChange={e => setField('lead_children_info', e.target.value)} placeholder="e.g. 2 kids, ages 4 and 7" />
                </div>

                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={activeForm.lead_email}
                    onChange={e => setField('lead_email', e.target.value)} placeholder="e.g. jane@gmail.com" />
                </div>

                <div className="form-field">
                  <label className="form-label">Budget ($)</label>
                  <input className="form-input" type="number" value={activeForm.lead_budget}
                    onChange={e => setField('lead_budget', e.target.value)} placeholder="750000" />
                </div>

                <div className="form-field form-field--full">
                  <label className="form-label">Lead Status</label>
                  <div className="status-options">
                    {STATUSES.map(s => (
                      <button key={s} type="button"
                        className={`status-option ${activeForm.lead_status === s ? 'selected' : ''}`}
                        onClick={() => setField('lead_status', s)}>
                        <StatusPill status={s} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field form-field--full">
                  <label className="form-label">Notes</label>
                  <div className="textarea-wrap">
                    <textarea className="form-textarea" value={activeForm.lead_notes}
                      onChange={e => setField('lead_notes', e.target.value)}
                      placeholder="Any additional context…" rows={4}
                      disabled={recording || transcribing}
                      style={{ paddingRight: '48px' }}
                    />
                    <MicButton />
                  </div>
                  {tab === 'fields' && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      🎙 Voice input appends to notes
                    </p>
                  )}
                  {recording && (
                    <div className="voice-status recording" style={{ marginTop: '6px' }}>
                      <span className="voice-dot" /> Recording…
                    </div>
                  )}
                  {transcribing && (
                    <div className="voice-status transcribing" style={{ marginTop: '6px' }}>
                      <span className="spinner spinner--dark" /> Transcribing…
                    </div>
                  )}
                  {voiceError && <p className="form-error" style={{ marginTop: '6px' }}>{voiceError}</p>}
                </div>
              </div>

              {saving && (
                <div className="saving-notice">
                  <span className="spinner spinner--dark" /> Saving and regenerating AI summary…
                </div>
              )}

              {saveError && <p className="form-error">{saveError}</p>}

              <div className="form-actions">
                <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : 'Save Update'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
