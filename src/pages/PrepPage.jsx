import { SHARED_ITEMS, PERSONAL_ITEMS } from '../constants'
import { useSharedChecks, usePersonalChecks } from '../hooks/useFirebase'

function CheckItem({ text, done, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', borderRadius: 10, marginBottom: 6,
      background: done ? '#E1F5EE' : '#f9f9f9',
      border: done ? '0.5px solid #A3D9C6' : '0.5px solid #e8e8e8',
      cursor: 'pointer',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        background: done ? '#1D9E75' : '#fff',
        border: done ? 'none' : '1.5px solid #ccc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: '#fff',
      }}>{done ? '✓' : ''}</div>
      <span style={{ fontSize: 14, color: done ? '#085041' : '#333', textDecoration: done ? 'line-through' : 'none' }}>{text}</span>
    </div>
  )
}

export default function PrepPage({ me, onNext }) {
  const { sharedDone, toggleShared } = useSharedChecks()
  const { personalDone, togglePersonal } = usePersonalChecks(me.id)

  const sharedCount = SHARED_ITEMS.filter((i) => sharedDone[i.id]).length
  const personalCount = PERSONAL_ITEMS.filter((i) => personalDone[i.id]).length

  return (
    <div style={{ padding: '12px 16px 24px' }}>
      {/* 공동 준비물 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 10px' }}>
        <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, letterSpacing: 0.4 }}>공동 준비물</div>
        <div style={{ fontSize: 12, color: '#555' }}>{sharedCount}/{SHARED_ITEMS.length} 완료</div>
      </div>
      {SHARED_ITEMS.map((item) => (
        <CheckItem key={item.id} text={item.text} done={!!sharedDone[item.id]}
          onToggle={() => toggleShared(item.id, sharedDone[item.id])} />
      ))}

      {/* 개인 준비물 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 10px' }}>
        <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, letterSpacing: 0.4 }}>내 준비물 ({me.name})</div>
        <div style={{ fontSize: 12, color: '#555' }}>{personalCount}/{PERSONAL_ITEMS.length} 완료</div>
      </div>
      {PERSONAL_ITEMS.map((item) => (
        <CheckItem key={item.id} text={item.text} done={!!personalDone[item.id]}
          onToggle={() => togglePersonal(item.id, personalDone[item.id])} />
      ))}

      <button onClick={onNext} style={{
        width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 12,
        border: 'none', background: '#185FA5', color: '#fff', fontSize: 15, fontWeight: 600,
      }}>
        💸 정산으로 →
      </button>
    </div>
  )
}
