import { useState } from 'react'
import { useAllFriends } from '../hooks/useFriends'
import { useFriends } from '../hooks/useFriends'
import { FRIEND_COLORS, ROLE_EMOJIS } from '../constants'

function FriendForm({ initial, onSave, onCancel, colorIndex }) {
  const color = FRIEND_COLORS[colorIndex % FRIEND_COLORS.length]
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? ROLE_EMOJIS[0])
  const [bg, setBg] = useState(initial?.bg ?? color.bg)
  const [tc, setTc] = useState(initial?.tc ?? color.tc)

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), role: role.trim(), emoji, bg, tc, order: initial?.order ?? colorIndex })
  }

  return (
    <div style={styles.formBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)}
            style={styles.input} autoFocus />
        </div>
      </div>
      <input placeholder="역할 (선택, 예: 총무, 드라이버)" value={role}
        onChange={(e) => setRole(e.target.value)} style={{ ...styles.input, marginBottom: 10 }} />

      <div style={{ marginBottom: 10 }}>
        <div style={styles.label}>이모지</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ROLE_EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} style={{
              width: 36, height: 36, borderRadius: 8, border: emoji === e ? '2px solid #185FA5' : '0.5px solid #ddd',
              background: emoji === e ? '#E6F1FB' : '#f5f5f5', fontSize: 18, cursor: 'pointer',
            }}>{e}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={styles.label}>프로필 색상</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FRIEND_COLORS.map((c, i) => (
            <button key={i} onClick={() => { setBg(c.bg); setTc(c.tc) }} style={{
              width: 28, height: 28, borderRadius: '50%', background: c.bg,
              border: bg === c.bg ? `2px solid ${c.tc}` : '0.5px solid #ddd', cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={styles.cancelBtn} onClick={onCancel}>취소</button>
        <button style={styles.saveBtn} onClick={handleSave}>저장</button>
      </div>
    </div>
  )
}

export default function FriendsPage({ onBack }) {
  const { friends: allFriends, loading } = useAllFriends()
  const { addFriend, updateFriend, deactivateFriend } = useFriends()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  if (loading) return <div style={styles.center}>불러오는 중...</div>

  const activeFriends = allFriends.filter((f) => f.isActive !== false)
  const inactiveFriends = allFriends.filter((f) => f.isActive === false)

  async function handleAdd(data) {
    await addFriend({ ...data, order: allFriends.length })
    setAdding(false)
  }

  async function handleEdit(id, data) {
    await updateFriend(id, data)
    setEditingId(null)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← 뒤로</button>
        <div style={styles.title}>친구 관리</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: '12px 16px 32px' }}>
        <div style={styles.sectionLabel}>친구 목록 ({activeFriends.length}명)</div>

        {activeFriends.map((f) => (
          editingId === f.id ? (
            <FriendForm key={f.id} initial={f} colorIndex={allFriends.indexOf(f)}
              onSave={(data) => handleEdit(f.id, data)} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={f.id} style={styles.friendRow}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {f.emoji ?? f.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{f.name}</div>
                {f.role && <div style={{ fontSize: 12, color: '#888' }}>{f.role}</div>}
              </div>
              <button style={styles.editBtn} onClick={() => setEditingId(f.id)}>수정</button>
              <button style={styles.deactivateBtn} onClick={() => {
                if (window.confirm(`${f.name}을(를) 비활성화할까요? (기존 데이터는 유지됩니다)`))
                  deactivateFriend(f.id)
              }}>숨김</button>
            </div>
          )
        ))}

        {adding ? (
          <FriendForm colorIndex={allFriends.length} onSave={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <button style={styles.addBtn} onClick={() => setAdding(true)}>+ 친구 추가</button>
        )}

        {inactiveFriends.length > 0 && (
          <>
            <div style={{ ...styles.sectionLabel, marginTop: 24 }}>숨겨진 친구 ({inactiveFriends.length}명)</div>
            {inactiveFriends.map((f) => (
              <div key={f.id} style={{ ...styles.friendRow, opacity: 0.5 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {f.emoji ?? f.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{f.name}</div>
                  {f.role && <div style={{ fontSize: 12, color: '#888' }}>{f.role}</div>}
                </div>
                <button style={styles.editBtn} onClick={() => updateFriend(f.id, { isActive: true })}>복원</button>
              </div>
            ))}
          </>
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
  friendRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid #f5f5f5' },
  editBtn: { fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #e0e0e0', background: '#f5f5f5', color: '#555', cursor: 'pointer' },
  deactivateBtn: { fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' },
  addBtn: { width: '100%', marginTop: 12, padding: '13px 0', borderRadius: 12, border: '0.5px dashed #ccc', background: '#fafafa', color: '#555', fontSize: 14, cursor: 'pointer' },
  formBox: { border: '0.5px solid #e0e0e0', borderRadius: 14, padding: '16px', marginBottom: 10, background: '#fafafa' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  label: { fontSize: 12, color: '#888', marginBottom: 6 },
  cancelBtn: { flex: 1, padding: '10px 0', borderRadius: 10, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', fontSize: 14, cursor: 'pointer' },
  saveBtn: { flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: '#185FA5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
