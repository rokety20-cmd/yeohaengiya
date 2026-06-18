import { DATE_OPTIONS } from '../constants'

export default function ConfirmedBanner({ confirmedDate }) {
  if (!confirmedDate) return null
  const d = DATE_OPTIONS.find((x) => x.id === confirmedDate)
  if (!d) return null

  return (
    <div style={{
      background: '#1D9E75', color: '#fff', padding: '10px 18px',
      fontSize: 14, fontWeight: 500, textAlign: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span>🎉</span>
      <span>{d.start} ~ {d.end} 확정!</span>
      <span>🎉</span>
    </div>
  )
}
