const STEPS = [
  { id: 'home', label: '홈',      icon: '🏠' },
  { id: 'vote', label: '날짜 투표', icon: '📅' },
  { id: 'prep', label: '준비물',   icon: '🎒' },
  { id: 'cost', label: '정산',     icon: '💸' },
]

export default function StepBar({ current, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '0.5px solid #f0f0f0' }}>
      {STEPS.map((s) => {
        const active = current === s.id
        return (
          <button key={s.id} onClick={() => onChange(s.id)} style={{
            flex: 1, padding: '10px 0', border: 'none',
            background: active ? '#fff' : '#fafafa',
            borderBottom: active ? '2px solid #185FA5' : '2px solid transparent',
            color: active ? '#185FA5' : '#aaa', fontSize: 13, fontWeight: active ? 600 : 400,
            cursor: 'pointer',
          }}>
            {s.icon} {s.label}
          </button>
        )
      })}
    </div>
  )
}
