import { useState } from 'react'
import { useTrips } from '../hooks/useTrips'

const STATUS_LABEL = { planning: '준비 중', active: '진행 중', done: '완료' }
const STATUS_COLOR = { planning: '#185FA5', active: '#1D9E75', done: '#aaa' }

export default function TripSelectPage({ onSelect, onManageFriends }) {
  const { trips, loading, createTrip } = useTrips()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [dest, setDest] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!title.trim()) return
    setCreating(true)
    const id = await createTrip(title.trim(), dest.trim())
    setCreating(false)
    setShowForm(false)
    setTitle('')
    setDest('')
    onSelect(id)
  }

  if (loading) return <div style={styles.center}>불러오는 중...</div>

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.logo}>🏕️ 여행이야? 다들모여~</div>
        <button style={styles.friendsBtn} onClick={onManageFriends}>친구 관리</button>
      </div>

      <div style={styles.section}>
        {trips.length === 0 && !showForm && (
          <div style={styles.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
            <div style={{ color: '#888' }}>아직 여행이 없어요</div>
            <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>새 여행을 만들어보세요!</div>
          </div>
        )}

        {trips.map((trip) => {
          const memberCount = trip.members ? Object.keys(trip.members).length : 0
          const status = trip.meta?.status ?? 'planning'
          return (
            <button key={trip.id} style={styles.tripCard} onClick={() => onSelect(trip.id)}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={styles.tripTitle}>{trip.meta?.title ?? '(이름 없음)'}</div>
                {trip.meta?.destination && (
                  <div style={styles.tripSub}>📍 {trip.meta.destination}</div>
                )}
                <div style={styles.tripSub}>{memberCount > 0 ? `👥 ${memberCount}명` : '참가자 없음'}</div>
              </div>
              <div style={{ ...styles.badge, color: STATUS_COLOR[status] }}>
                {STATUS_LABEL[status] ?? status}
              </div>
            </button>
          )
        })}
      </div>

      {showForm ? (
        <div style={styles.form}>
          <input
            placeholder="여행 이름 (예: 2026 여름 펜션)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <input
            placeholder="목적지 (선택, 예: 강원도 인제)"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            style={styles.input}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>취소</button>
            <button style={styles.createBtn} onClick={handleCreate} disabled={creating}>
              {creating ? '만드는 중...' : '만들기'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px 32px' }}>
          <button style={styles.newTripBtn} onClick={() => setShowForm(true)}>
            + 새 여행 만들기
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: { maxWidth: 430, margin: '0 auto', background: '#fff', minHeight: '100vh' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#aaa' },
  header: { padding: '20px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #f0f0f0' },
  logo: { fontSize: 18, fontWeight: 700 },
  friendsBtn: { fontSize: 12, padding: '6px 12px', borderRadius: 20, border: '0.5px solid #e0e0e0', background: '#f5f5f5', color: '#555', cursor: 'pointer' },
  section: { padding: '16px 16px 8px' },
  empty: { textAlign: 'center', padding: '48px 0' },
  tripCard: { width: '100%', display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: 14, border: '0.5px solid #ebebeb', background: '#f9f9f9', marginBottom: 10, cursor: 'pointer', textAlign: 'left' },
  tripTitle: { fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 4 },
  tripSub: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: '#f0f0f0', flexShrink: 0 },
  form: { padding: '8px 16px 32px' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '0.5px solid #ddd', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  cancelBtn: { flex: 1, padding: '11px 0', borderRadius: 10, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', fontSize: 14, cursor: 'pointer' },
  createBtn: { flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: '#185FA5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  newTripBtn: { width: '100%', padding: '13px 0', borderRadius: 12, border: '0.5px dashed #ccc', background: '#fafafa', color: '#555', fontSize: 14, cursor: 'pointer' },
}
