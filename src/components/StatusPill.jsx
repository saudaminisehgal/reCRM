import './StatusPill.css'

const CONFIG = {
  cold:         { label: 'Cold',       color: 'cold' },
  warm:         { label: 'Warm',       color: 'warm' },
  hot:          { label: 'Hot',        color: 'hot' },
  nurturing:    { label: 'Nurturing',  color: 'nurturing' },
  'post-close': { label: 'Post-Close', color: 'post-close' },
  other:        { label: 'Other',      color: 'other' },
}

export default function StatusPill({ status, size = 'sm' }) {
  const cfg = CONFIG[status] || CONFIG['other']
  return (
    <span className={`status-pill status-pill--${cfg.color} status-pill--${size}`}>
      {cfg.label}
    </span>
  )
}
