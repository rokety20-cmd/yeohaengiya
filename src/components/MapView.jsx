export default function MapView({ departure, waypoints, destination }) {
  const points = [
    departure ? { label: '출발', text: departure, color: '#085041', bg: '#E1F5EE' } : null,
    ...(waypoints || []).map((w, i) => w ? ({ label: `경유${i + 1}`, text: w, color: '#E07B00', bg: '#FAEEDA' }) : null),
    destination ? { label: '도착', text: destination, color: '#0C447C', bg: '#E6F1FB' } : null,
  ].filter(Boolean)

  if (points.length === 0) return null

  return (
    <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>🗺 경로</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {points.map((pt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 8,
              background: pt.bg, color: pt.color, fontWeight: 600, flexShrink: 0,
            }}>{pt.label}</span>
            <span style={{ fontSize: 13, color: '#333' }}>{pt.text}</span>
            {i < points.length - 1 && (
              <span style={{ fontSize: 11, color: '#ccc', marginLeft: 'auto' }}>↓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
