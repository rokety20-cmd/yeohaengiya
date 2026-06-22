import { useState } from 'react'
import { useCostItems } from '../hooks/useCostItems'
import { useTripMeta } from '../hooks/useTrips'
import { useFriends } from '../hooks/useFriends'
import { splitEvenly, calculateSettlement } from '../utils/settlement'

// 금액 → "30만원" / "12만 5,000원" / "8,000원" 형태로 변환
function fmtAmt(n) {
  const v = Math.round(Number(n) || 0)
  if (v === 0) return '0원'
  const man = Math.floor(v / 10000)
  const rest = v % 10000
  if (man > 0 && rest === 0) return `${man.toLocaleString()}만원`
  if (man > 0) return `${man.toLocaleString()}만 ${rest.toLocaleString()}원`
  return `${rest.toLocaleString()}원`
}

// 숫자 입력 + 실시간 만원 미리보기
function AmountInput({ value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '총 금액 (원)'}
          style={{ ...inp, paddingRight: 80 }}
        />
        {Number(value) > 0 && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: '#185FA5', fontWeight: 500, pointerEvents: 'none',
          }}>
            {fmtAmt(value)}
          </span>
        )}
      </div>
    </div>
  )
}

const CATEGORIES = [
  { value: 'pension', label: '🏡 숙소' },
  { value: 'food', label: '🍖 식비' },
  { value: 'transport', label: '🚗 교통' },
  { value: 'prep', label: '🎒 준비물' },
  { value: 'other', label: '기타' },
]

function AccountSection({ meta, updateMeta, isTreasurer }) {
  const account = meta?.account
  const [editing, setEditing] = useState(false)
  const [bank, setBank] = useState(account?.bank ?? '')
  const [number, setNumber] = useState(account?.number ?? '')
  const [holder, setHolder] = useState(account?.holder ?? '')

  async function handleSave() {
    await updateMeta({ account: { bank: bank.trim(), number: number.trim(), holder: holder.trim() } })
    setEditing(false)
  }

  function handleCopy() {
    const text = `${account.bank} ${account.number} (${account.holder})`
    navigator.clipboard.writeText(text).then(() => alert(`복사됨!\n${text}`))
  }

  if (!account?.number && !isTreasurer) return null

  return (
    <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#633806', fontWeight: 500, marginBottom: 8, letterSpacing: 0.4 }}>
        💰 정산 계좌 {isTreasurer ? '(내 계좌)' : ''}
      </div>
      {editing || !account?.number ? (
        <>
          <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="은행명 (예: 카카오뱅크)" style={inp} />
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="계좌번호" style={{ ...inp, marginTop: 6 }} />
          <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="예금주" style={{ ...inp, marginTop: 6, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {account?.number && <button onClick={() => setEditing(false)} style={cancelBtn}>취소</button>}
            <button onClick={handleSave} style={saveBtn}>저장</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{account.bank} {account.number}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>예금주: {account.holder}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleCopy} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#E07B00', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>복사</button>
            {isTreasurer && (
              <button onClick={() => { setBank(account.bank); setNumber(account.number); setHolder(account.holder); setEditing(true) }} style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', fontSize: 12, color: '#888', cursor: 'pointer' }}>수정</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AddExpenseForm({ members, memberIds, onAdd, onCancel }) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [payerId, setPayerId] = useState(memberIds[0] || '')
  const [allParticipants, setAllParticipants] = useState(true)
  const [participantIds, setParticipantIds] = useState([...memberIds])
  const [category, setCategory] = useState('other')

  function toggleParticipant(id) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleAdd() {
    if (!label.trim() || !amount) return
    const ids = allParticipants ? memberIds : participantIds
    onAdd(label.trim(), Number(amount), payerId, ids, category)
  }

  return (
    <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginTop: 4, marginBottom: 8 }}>
      <input autoFocus placeholder="항목 이름" value={label} onChange={(e) => setLabel(e.target.value)}
        style={{ ...inp, marginBottom: 8 }} />
      <AmountInput value={amount} onChange={setAmount} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>결제자</div>
          <select value={payerId} onChange={(e) => setPayerId(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>카테고리</div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', cursor: 'pointer', marginBottom: 6 }}>
          <input type="checkbox" checked={allParticipants} onChange={(e) => setAllParticipants(e.target.checked)} />
          전원 참여
        </label>
        {!allParticipants && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {members.map((m) => (
              <button key={m.id} onClick={() => toggleParticipant(m.id)} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `0.5px solid ${participantIds.includes(m.id) ? '#185FA5' : '#e0e0e0'}`,
                background: participantIds.includes(m.id) ? '#E6F1FB' : '#f5f5f5',
                color: participantIds.includes(m.id) ? '#0C447C' : '#888',
              }}>{m.name}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={cancelBtn}>취소</button>
        <button onClick={handleAdd} style={saveBtn}>추가</button>
      </div>
    </div>
  )
}

// 인라인 편집 폼 — 기존 항목 수정
function EditExpenseRow({ item, members, memberIds, onSave, onCancel }) {
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(item.totalAmount ?? '')
  const [payerId, setPayerId] = useState(item.payerId || memberIds[0] || '')
  const [allPart, setAllPart] = useState(!item.participantIds?.length || item.participantIds.length === memberIds.length)
  const [partIds, setPartIds] = useState(item.participantIds?.length ? item.participantIds : [...memberIds])
  const [category, setCategory] = useState(item.category || 'other')

  function toggle(id) {
    setPartIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handleSave() {
    if (!label.trim() || !amount) return
    onSave({
      label: label.trim(),
      totalAmount: Number(amount),
      payerId,
      participantIds: allPart ? memberIds : partIds,
      category,
    })
  }

  return (
    <div style={{ background: '#FFFBE6', border: '1px solid #E0C97A', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: '#856404', fontWeight: 500, marginBottom: 8 }}>✏️ 항목 수정</div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="항목 이름" style={{ ...inp, marginBottom: 8 }} />
      <AmountInput value={amount} onChange={setAmount} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>결제자</div>
          <select value={payerId} onChange={(e) => setPayerId(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>카테고리</div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', cursor: 'pointer', marginBottom: 6 }}>
          <input type="checkbox" checked={allPart} onChange={(e) => setAllPart(e.target.checked)} />
          전원 참여
        </label>
        {!allPart && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {members.map((m) => (
              <button key={m.id} onClick={() => toggle(m.id)} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `0.5px solid ${partIds.includes(m.id) ? '#185FA5' : '#e0e0e0'}`,
                background: partIds.includes(m.id) ? '#E6F1FB' : '#f5f5f5',
                color: partIds.includes(m.id) ? '#0C447C' : '#888',
              }}>{m.name}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={cancelBtn}>취소</button>
        <button onClick={handleSave} style={{ ...saveBtn, background: '#856404' }}>저장</button>
      </div>
    </div>
  )
}

export default function CostPage({ me, tripId, tripMembers }) {
  const memberIds = tripMembers || []
  const { items, loading, addExpense, updateExpense, deleteItem, seedExpenses } = useCostItems(tripId)
  const { meta, updateMeta } = useTripMeta(tripId)
  const { friends } = useFriends()
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [editingId, setEditingId] = useState(null)

  const isTreasurer = me?.role === '총무'
  const memberMap = Object.fromEntries(friends.map((f) => [f.id, f]))
  const members = memberIds.map((id) => memberMap[id]).filter(Boolean)

  // Settlement calculation
  const expensesForCalc = items
    .filter((e) => !e.isDeleted)
    .map((e) => ({
      ...e,
      shares: splitEvenly(e.totalAmount, e.participantIds?.length ? e.participantIds : memberIds),
    }))
  const transfers = calculateSettlement(expensesForCalc, memberIds)

  const totalSpent = items.reduce((s, e) => s + (e.totalAmount || 0), 0)
  const avgPerPerson = memberIds.length > 0 ? Math.round(totalSpent / memberIds.length) : 0

  const account = meta?.account

  function copySettlement() {
    const transferLines = transfers.length > 0
      ? transfers.map((t) => `• ${memberMap[t.from]?.name ?? t.from} → ${memberMap[t.to]?.name ?? t.to}: ${t.amount.toLocaleString()}원`).join('\n')
      : '• 모두 동등하게 냈어요!'
    const accountLine = account?.number
      ? `\n총무 계좌: ${account.bank} ${account.number} (${account.holder})`
      : ''
    const text = `[여행 정산]\n총 지출: ${totalSpent.toLocaleString()}원\n1인 평균: ${avgPerPerson.toLocaleString()}원\n\n송금 목록:\n${transferLines}${accountLine}`
    navigator.clipboard.writeText(text).then(() => alert('복사됨!\n\n' + text))
  }

  const filteredItems = filterCat === 'all' ? items : items.filter((e) => e.category === filterCat)

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  return (
    <div style={{ padding: '12px 16px 32px' }}>
      <AccountSection meta={meta} updateMeta={updateMeta} isTreasurer={isTreasurer} />

      <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#555' }}>
        👥 참가자: <strong>{memberIds.length}명</strong>
        {memberIds.length === 0 && <span style={{ color: '#f09595', marginLeft: 6 }}>(참가자를 먼저 설정해주세요)</span>}
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
        <button onClick={() => setFilterCat('all')} style={filterChip(filterCat === 'all')}>전체</button>
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setFilterCat(c.value)} style={filterChip(filterCat === c.value)}>{c.label}</button>
        ))}
      </div>

      {/* 지출 목록 */}
      {items.length === 0 && (
        <button onClick={() => seedExpenses(memberIds.length, memberIds)} style={{
          width: '100%', padding: '10px 0', borderRadius: 10, marginBottom: 12,
          border: '0.5px solid #85B7EB', background: '#E6F1FB', color: '#0C447C',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>📋 기본 정산 항목 불러오기</button>
      )}

      {filteredItems.map((item) => {
        const payer = memberMap[item.payerId]
        const participants = (item.participantIds?.length ? item.participantIds : memberIds)
        const perPerson = participants.length > 0 ? Math.round((item.totalAmount || 0) / participants.length) : 0
        const catInfo = CATEGORIES.find((c) => c.value === item.category)
        const isEditing = editingId === item.id

        if (isEditing) {
          return (
            <EditExpenseRow
              key={item.id}
              item={item}
              members={members}
              memberIds={memberIds}
              onSave={(fields) => { updateExpense(item.id, fields); setEditingId(null) }}
              onCancel={() => setEditingId(null)}
            />
          )
        }

        return (
          <div key={item.id} style={{
            padding: '10px 12px', borderRadius: 10, marginBottom: 6,
            background: '#f9f9f9', border: '0.5px solid #eee',
          }}>
            {/* 1행: 이름 + 금액 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                {catInfo && <span style={{ fontSize: 12 }}>{catInfo.label.split(' ')[0]}</span>}
                <span style={{ fontSize: 14, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                {item.category === 'prep' && item.linkedPackingItemId && (
                  <span style={{ fontSize: 11, color: '#633806' }}>🎒</span>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#333', flexShrink: 0 }}>
                {fmtAmt(item.totalAmount)}
              </span>
            </div>
            {/* 2행: 결제자·분담자·1인 + 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {payer && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: payer.bg || '#eee', color: payer.tc || '#333' }}>
                  결제 {payer.name}
                </span>
              )}
              <span style={{ fontSize: 11, color: '#aaa' }}>
                {participants.length}명 분담 · 1인 {fmtAmt(perPerson)}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button onClick={() => { setEditingId(item.id); setShowForm(false) }} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '0.5px solid #d0b800',
                  background: '#FFFBE6', color: '#856404', cursor: 'pointer',
                }}>✏️ 수정</button>
                <button onClick={() => deleteItem(item.id)} style={{
                  fontSize: 11, padding: '3px 6px', borderRadius: 8, border: '0.5px solid #f09595',
                  background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer',
                }}>✕</button>
              </div>
            </div>
          </div>
        )
      })}

      {showForm ? (
        <AddExpenseForm
          members={members}
          memberIds={memberIds}
          onAdd={(label, amount, payerId, participantIds, category) => {
            addExpense(label, amount, payerId, participantIds, category)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button onClick={() => setShowForm(true)} style={{
          width: '100%', padding: '9px 0', borderRadius: 10, border: '0.5px dashed #ccc',
          background: '#fafafa', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 16,
        }}>+ 지출 추가</button>
      )}

      {/* 정산 요약 */}
      <div style={{ background: '#E6F1FB', borderRadius: 14, padding: '14px 16px', marginTop: 8 }}>
        <div style={{ fontSize: 11, color: '#0C447C', fontWeight: 500, marginBottom: 8, letterSpacing: 0.4 }}>정산 요약</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>총 지출</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0C447C' }}>{fmtAmt(totalSpent)}</div>
            <div style={{ fontSize: 11, color: '#6FA3D9', marginTop: 1 }}>{totalSpent.toLocaleString()}원</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#888' }}>1인 평균</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0C447C' }}>{fmtAmt(avgPerPerson)}</div>
            <div style={{ fontSize: 11, color: '#6FA3D9', marginTop: 1 }}>{avgPerPerson.toLocaleString()}원</div>
          </div>
        </div>

        {transfers.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#1D9E75', fontSize: 13, fontWeight: 500, padding: '8px 0' }}>
            🎉 모두 동등하게 냈어요!
          </div>
        ) : (
          <div>
            {transfers.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderTop: i === 0 ? 'none' : '0.5px solid #d0e4f7' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
                  {memberMap[t.from]?.name ?? t.from}
                </span>
                <span style={{ fontSize: 12, color: '#888' }}>→</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
                  {memberMap[t.to]?.name ?? t.to}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#A32D2D', marginLeft: 'auto' }}>
                  {fmtAmt(t.amount)}
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#c0676e', marginLeft: 4 }}>({t.amount.toLocaleString()}원)</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={copySettlement} style={{
          width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 10,
          border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>📋 카톡 정산문 복사</button>
      </div>
    </div>
  )
}

const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box' }
const cancelBtn = { flex: 1, padding: '8px 0', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }
const saveBtn = { flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: '#E07B00', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const filterChip = (active) => ({
  padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
  border: `0.5px solid ${active ? '#85B7EB' : '#e0e0e0'}`,
  background: active ? '#E6F1FB' : '#f5f5f5',
  color: active ? '#0C447C' : '#888',
  fontWeight: active ? 500 : 400,
})
