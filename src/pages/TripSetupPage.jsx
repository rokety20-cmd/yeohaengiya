import { useState, useEffect } from 'react'
import { useFriends } from '../hooks/useFriends'
import { useTripMembers, useTripMeta } from '../hooks/useTrips'

function Avatar({ friend }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: friend.bg ?? '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
      {friend.emoji ?? friend.name[0]}
    </div>
  )
}

// 나를 선택하는 화면
function SelectMeStep({ tripMembers, meta, onSelect, onBack }) {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← 뒤로</button>
        <div style={s.title}>{meta?.title ?? '여행'}</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ padding: '20px 18px 32px' }}>
        {meta?.membersConfirmed && (
          <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#085041', display: 'flex', alignItems: 'center', gap: 8 }}>
            🔒 참가자 {tripMembers.length}명 확정됨
          </div>
        )}
        <div style={s.hint}>나를 선택해줘 👇</div>
        {tripMembers.map((f) => (
          <button key={f.id} style={s.memberBtn} onClick={() => onSelect(f)}>
            <Avatar friend={f} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{f.name}</div>
              {f.role && <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>{f.role}</div>}
            </div>
            <span style={{ fontSize: 22 }}>{f.emoji ?? '👤'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TripSetupPage({ tripId, onReady, onBack }) {
  const { friends, loading: fl } = useFriends()
  const { memberIds, loading: ml, addMember, removeMember } = useTripMembers(tripId)
  const { meta, loading: metaL, updateMeta } = useTripMeta(tripId)
  const [step, setStep] = useState('members')
  const [confirming, setConfirming] = useState(false)

  const loading = fl || ml || metaL
  const isConfirmed = meta?.membersConfirmed === true

  // 이미 확정된 여행이면 바로 나 선택 단계로
  useEffect(() => {
    if (isConfirmed) setStep('selectMe')
  }, [isConfirmed])

  if (loading) return <div style={s.center}>불러오는 중...</div>

  const tripMembers = friends.filter((f) => memberIds.includes(f.id))
  const nonMembers = friends.filter((f) => !memberIds.includes(f.id))

  async function handleConfirm() {
    if (tripMembers.length === 0) return alert('참가자를 먼저 추가해주세요')
    if (!window.confirm(`${tripMembers.map(f => f.name).join(', ')}\n총 ${tripMembers.length}명으로 참가자를 확정할까요?\n\n확정 후에는 참가자를 변경할 수 없습니다.`)) return
    setConfirming(true)
    await updateMeta({ membersConfirmed: true })
    setConfirming(false)
    setStep('selectMe')
  }

  if (step === 'selectMe') {
    return (
      <SelectMeStep
        tripMembers={tripMembers}
        meta={meta}
        onSelect={(f) => onReady(f, tripId)}
        onBack={isConfirmed ? onBack : () => setStep('members')}
      />
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← 뒤로</button>
        <div style={s.title}>{meta?.title ?? '여행'}</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: '16px 18px 32px' }}>
        <div style={s.sectionLabel}>참가자 ({tripMembers.length}명)</div>

        {tripMembers.length === 0 && (
          <div style={s.empty}>아직 참가자가 없어요. 아래에서 친구를 추가해주세요.</div>
        )}

        {tripMembers.map((f) => (
          <div key={f.id} style={s.row}>
            <Avatar friend={f} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{f.name}</div>
              {f.role && <div style={{ fontSize: 12, color: '#888' }}>{f.role}</div>}
            </div>
            <button style={s.removeBtn} onClick={() => removeMember(f.id)}>제거</button>
          </div>
        ))}

        {nonMembers.length > 0 && (
          <>
            <div style={{ ...s.sectionLabel, marginTop: 20 }}>친구 추가</div>
            {nonMembers.map((f) => (
              <div key={f.id} style={{ ...s.row, opacity: 0.6 }}>
                <Avatar friend={f} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{f.name}</div>
                  {f.role && <div style={{ fontSize: 12, color: '#888' }}>{f.role}</div>}
                </div>
                <button style={s.addBtn} onClick={() => addMember(f.id)}>+ 추가</button>
              </div>
            ))}
          </>
        )}

        {tripMembers.length > 0 && (
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 확정 버튼 */}
            <button
              style={{ ...s.nextBtn, background: '#1D9E75' }}
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? '확정 중...' : `🔒 참가자 ${tripMembers.length}명 확정하기`}
            </button>
            {/* 확정 없이 그냥 입장 */}
            <button style={{ ...s.nextBtn, background: '#185FA5' }} onClick={() => setStep('selectMe')}>
              입장하기 →
            </button>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: '#bbb', textAlign: 'center', lineHeight: 1.6 }}>
          확정하면 참가자가 고정되고 이후 변경 불가
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { maxWidth: 520, margin: '0 auto', background: '#fff', minHeight: '100vh' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#aaa' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0' },
  backBtn: { fontSize: 14, color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  title: { fontSize: 16, fontWeight: 600 },
  sectionLabel: { fontSize: 11, color: '#aaa', fontWeight: 500, letterSpacing: 0.4, marginBottom: 10 },
  hint: { fontSize: 13, color: '#aaa', marginBottom: 14, fontWeight: 500 },
  empty: { color: '#bbb', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #f5f5f5' },
  removeBtn: { fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' },
  addBtn: { fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #85B7EB', background: '#E6F1FB', color: '#0C447C', cursor: 'pointer' },
  memberBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 14, border: '0.5px solid #ebebeb', background: '#f9f9f9', marginBottom: 10, cursor: 'pointer' },
  nextBtn: { width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}
