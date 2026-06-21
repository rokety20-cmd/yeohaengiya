import { useState } from 'react'
import { useTrips } from '../hooks/useTrips'

const STATUS_LABEL = { planning: '준비 중', active: '진행 중', done: '완료' }
const STATUS_COLOR = { planning: '#185FA5', active: '#1D9E75', done: '#aaa' }

export default function TripSelectPage({ onSelect, onManageFriends }) {
  const { trips, loading, createTrip, deleteTrip } = useTrips()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [dest, setDest] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [creating, setCreating] = useState(false)

  const [deletingId, setDeletingId] = useState(null)
  const [deletePass, setDeletePass] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleCreate() {
    if (!title.trim()) return
    if (!deletePassword.trim()) return alert('삭제 비밀번호를 설정해주세요')
    setCreating(true)
    const id = await createTrip(title.trim(), dest.trim(), deletePassword.trim())
    setCreating(false)
    setShowForm(false)
    setTitle('')
    setDest('')
    setDeletePassword('')
    onSelect(id)
  }

  function startDelete(e, tripId) {
    e.stopPropagation()
    setDeletingId(tripId)
    setDeletePass('')
    setDeleteError('')
  }

  async function handleDelete(tripId) {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteTrip(tripId, deletePass)
      setDeletingId(null)
      setDeletePass('')
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div style={s.center}>불러오는 중...</div>

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>🏕️ 여행이야? 다들모여~</div>
        <button style={s.friendsBtn} onClick={onManageFriends}>친구 관리</button>
      </div>

      <div style={s.section}>
        {trips.length === 0 && !showForm && (
          <div style={s.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
            <div style={{ color: '#888' }}>아직 여행이 없어요</div>
            <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>새 여행을 만들어보세요!</div>
          </div>
        )}

        {trips.map((trip) => {
          const memberCount = trip.members ? Object.keys(trip.members).length : 0
          const status = trip.meta?.status ?? 'planning'
          const isDeleting = deletingId === trip.id

          return (
            <div key={trip.id}>
              <div style={s.tripRow}>
                <button style={s.tripCard} onClick={() => onSelect(trip.id)}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={s.tripTitle}>{trip.meta?.title ?? '(이름 없음)'}</div>
                    {trip.meta?.destination && (
                      <div style={s.tripSub}>📍 {trip.meta.destination}</div>
                    )}
                    <div style={s.tripSub}>{memberCount > 0 ? `👥 ${memberCount}명` : '참가자 없음'}</div>
                  </div>
                  <div style={{ ...s.badge, color: STATUS_COLOR[status] }}>
                    {STATUS_LABEL[status] ?? status}
                  </div>
                </button>
                {/* 삭제 버튼 */}
                <button
                  style={s.deleteIcon}
                  onClick={(e) => isDeleting ? (setDeletingId(null), setDeleteError('')) : startDelete(e, trip.id)}
                  title="여행 삭제"
                >
                  {isDeleting ? '✕' : '🗑️'}
                </button>
              </div>

              {/* 삭제 비밀번호 입력 */}
              {isDeleting && (
                <div style={s.deleteBox}>
                  <div style={{ fontSize: 13, color: '#A32D2D', fontWeight: 500, marginBottom: 8 }}>
                    ⚠️ 삭제하면 모든 데이터가 사라져요
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      autoFocus
                      type="password"
                      placeholder="삭제 비밀번호 입력"
                      value={deletePass}
                      onChange={(e) => setDeletePass(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDelete(trip.id)}
                      style={s.passInput}
                    />
                    <button
                      onClick={() => handleDelete(trip.id)}
                      disabled={deleting || !deletePass}
                      style={s.confirmDeleteBtn}
                    >
                      {deleting ? '...' : '삭제'}
                    </button>
                  </div>
                  {deleteError && (
                    <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 6 }}>{deleteError}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showForm ? (
        <div style={s.form}>
          <input
            placeholder="여행 이름 (예: 2026 여름 펜션)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={s.input}
            autoFocus
          />
          <input
            placeholder="목적지 (선택, 예: 강원도 인제)"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            style={s.input}
          />
          <input
            placeholder="🔐 삭제 비밀번호 (나중에 여행 삭제 시 필요)"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            style={s.input}
          />
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, marginTop: -4 }}>
            * 비밀번호를 잊으면 삭제할 수 없어요. 메모해두세요!
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.cancelBtn} onClick={() => { setShowForm(false); setDeletePassword('') }}>취소</button>
            <button style={s.createBtn} onClick={handleCreate} disabled={creating}>
              {creating ? '만드는 중...' : '만들기'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px 32px' }}>
          <button style={s.newTripBtn} onClick={() => setShowForm(true)}>
            + 새 여행 만들기
          </button>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { background: '#fff', minHeight: '100vh' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#aaa' },
  header: { padding: '20px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #f0f0f0' },
  logo: { fontSize: 18, fontWeight: 700 },
  friendsBtn: { fontSize: 12, padding: '6px 12px', borderRadius: 20, border: '0.5px solid #e0e0e0', background: '#f5f5f5', color: '#555', cursor: 'pointer' },
  section: { padding: '16px 16px 8px' },
  empty: { textAlign: 'center', padding: '48px 0' },
  tripRow: { display: 'flex', alignItems: 'stretch', gap: 6, marginBottom: 4 },
  tripCard: { flex: 1, display: 'flex', alignItems: 'center', padding: '14px 14px', borderRadius: 14, border: '0.5px solid #ebebeb', background: '#f9f9f9', cursor: 'pointer', textAlign: 'left' },
  tripTitle: { fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 4 },
  tripSub: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: '#f0f0f0', flexShrink: 0 },
  deleteIcon: { padding: '0 12px', borderRadius: 12, border: '0.5px solid #f0c5c5', background: '#fff8f8', fontSize: 16, cursor: 'pointer', flexShrink: 0 },
  deleteBox: { background: '#fff5f5', border: '0.5px solid #f0c5c5', borderRadius: 10, padding: '12px 14px', marginBottom: 10 },
  passInput: { flex: 1, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #f0c5c5', fontSize: 13, boxSizing: 'border-box' },
  confirmDeleteBtn: { padding: '9px 16px', borderRadius: 8, border: 'none', background: '#c0392b', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 },
  form: { padding: '8px 16px 32px' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '0.5px solid #ddd', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  cancelBtn: { flex: 1, padding: '11px 0', borderRadius: 10, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', fontSize: 14, cursor: 'pointer' },
  createBtn: { flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: '#185FA5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  newTripBtn: { width: '100%', padding: '13px 0', borderRadius: 12, border: '0.5px dashed #ccc', background: '#fafafa', color: '#555', fontSize: 14, cursor: 'pointer' },
}
