/**
 * 여행 입장 시 참가자 설정 + 나 선택 화면.
 * - 여행에 참가자가 없으면: 친구 목록에서 참가자 추가 후 나 선택
 * - 참가자가 있으면: 나 선택만
 */
import { useState } from 'react'
import { useFriends } from '../hooks/useFriends'
import { useTripMembers, useTripMeta } from '../hooks/useTrips'

function Avatar({ friend }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: friend.bg ?? '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: friend.tc }}>
      {friend.emoji ?? friend.name[0]}
    </div>
  )
}

export default function TripSetupPage({ tripId, onReady, onBack }) {
  const { friends, loading: fl } = useFriends()
  const { memberIds, loading: ml, addMember, removeMember } = useTripMembers(tripId)
  const { meta } = useTripMeta(tripId)
  const [step, setStep] = useState('members') // 'members' | 'selectMe'
  const [me, setMe] = useState(null)

  const loading = fl || ml
  if (loading) return <div style={styles.center}>불러오는 중...</div>

  const tripMembers = friends.filter((f) => memberIds.includes(f.id))
  const nonMembers = friends.filter((f) => !memberIds.includes(f.id))

  if (step === 'selectMe') {
    return (
      <div style={styles.wrap}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => setStep('members')}>← 뒤로</button>
          <div style={styles.title}>{meta?.title ?? '여행'}</div>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ padding: '20px 18px 32px' }}>
          <div style={styles.hint}>나를 선택해줘 👇</div>
          {tripMembers.map((f) => (
            <button key={f.id} style={styles.memberBtn} onClick={() => { setMe(f); onReady(f, tripId) }}>
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

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← 뒤로</button>
        <div style={styles.title}>{meta?.title ?? '여행'}</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: '16px 18px 32px' }}>
        <div style={styles.sectionLabel}>참가자 ({tripMembers.length}명)</div>

        {tripMembers.length === 0 && (
          <div style={styles.empty}>아직 참가자가 없어요. 친구를 추가해주세요.</div>
        )}

        {tripMembers.map((f) => (
          <div key={f.id} style={styles.row}>
            <Avatar friend={f} />
            <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{f.name}</div>
            <button style={styles.removeBtn} onClick={() => removeMember(f.id)}>제거</button>
          </div>
        ))}

        {nonMembers.length > 0 && (
          <>
            <div style={{ ...styles.sectionLabel, marginTop: 20 }}>친구 추가</div>
            {nonMembers.map((f) => (
              <div key={f.id} style={{ ...styles.row, opacity: 0.6 }}>
                <Avatar friend={f} />
                <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{f.name}</div>
                <button style={styles.addFriendBtn} onClick={() => addMember(f.id)}>+ 추가</button>
              </div>
            ))}
          </>
        )}

        {friends.length === 0 && (
          <div style={styles.empty}>등록된 친구가 없어요. 홈에서 친구를 먼저 추가해주세요.</div>
        )}

        {tripMembers.length > 0 && (
          <button style={styles.nextBtn} onClick={() => setStep('selectMe')}>
            입장하기 →
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: { maxWidth: 430, margin: '0 auto', background: '#fff', minHeight: '100vh' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#aaa' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0' },
  backBtn: { fontSize: 14, color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  title: { fontSize: 16, fontWeight: 600 },
  sectionLabel: { fontSize: 11, color: '#aaa', fontWeight: 500, letterSpacing: 0.4, marginBottom: 10 },
  hint: { fontSize: 13, color: '#aaa', marginBottom: 14, fontWeight: 500 },
  empty: { color: '#bbb', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #f5f5f5' },
  removeBtn: { fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' },
  addFriendBtn: { fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #85B7EB', background: '#E6F1FB', color: '#0C447C', cursor: 'pointer' },
  memberBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 14, border: '0.5px solid #ebebeb', background: '#f9f9f9', marginBottom: 10, cursor: 'pointer' },
  nextBtn: { width: '100%', marginTop: 28, padding: '13px 0', borderRadius: 12, border: 'none', background: '#185FA5', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}
