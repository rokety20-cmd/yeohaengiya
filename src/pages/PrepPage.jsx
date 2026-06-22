import { useState } from 'react'
import { usePackingItems } from '../hooks/usePackingItems'
import { useCostItems } from '../hooks/useCostItems'
import { useTripMembers } from '../hooks/useTrips'
import { useFriends } from '../hooks/useFriends'

// Row for shared items — includes "구매 완료" button
function SharedCheckRow({ item, friends, onToggle, onAssign, onDelete, me, onMarkBought }) {
  const [showAssign, setShowAssign] = useState(false)
  const [showBuyForm, setShowBuyForm] = useState(false)
  const [buyAmount, setBuyAmount] = useState('')
  const assignedFriend = friends.find((f) => f.id === item.assignedTo)
  const isBought = item.purchaseStatus === 'bought'

  function handleConfirmBuy() {
    if (!buyAmount) return
    onMarkBought(item.id, Number(buyAmount), me.id)
    setShowBuyForm(false)
    setBuyAmount('')
  }

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 10, marginBottom: 6,
      background: isBought ? '#E1F5EE' : item.done ? '#f0f9f5' : '#f9f9f9',
      border: isBought ? '0.5px solid #A3D9C6' : item.done ? '0.5px solid #c5e8d8' : '0.5px solid #e8e8e8',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* 체크박스 */}
        <div onClick={() => onToggle(item.id, item.done)} style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
          background: item.done ? '#1D9E75' : '#fff',
          border: item.done ? 'none' : '1.5px solid #ccc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#fff',
        }}>{item.done ? '✓' : ''}</div>

        <span style={{ flex: 1, fontSize: 14, color: isBought ? '#085041' : item.done ? '#333' : '#333', textDecoration: item.done && !isBought ? 'line-through' : 'none' }}>
          {item.text}
        </span>

        {assignedFriend && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: assignedFriend.bg, color: assignedFriend.tc, flexShrink: 0 }}>
            {assignedFriend.name}
          </span>
        )}

        {/* 구매 완료 badge 또는 버튼 */}
        {isBought ? (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#1D9E75', color: '#fff', flexShrink: 0, fontWeight: 500 }}>
            구매완료 {(item.purchaseAmount || 0).toLocaleString()}원
          </span>
        ) : (
          <button onClick={() => setShowBuyForm(!showBuyForm)} style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '0.5px solid #85B7EB',
            background: '#E6F1FB', color: '#0C447C', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}>구매 완료</button>
        )}

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowAssign(!showAssign)} style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '0.5px solid #e0e0e0',
            background: '#fff', color: '#888', cursor: 'pointer', flexShrink: 0,
          }}>배정</button>

          {showAssign && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 10,
              background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 8, minWidth: 120,
            }}>
              <div onClick={() => { onAssign(item.id, null); setShowAssign(false) }}
                style={{ padding: '6px 10px', fontSize: 13, cursor: 'pointer', color: '#888', borderRadius: 6 }}>
                담당자 없음
              </div>
              {friends.map((f) => (
                <div key={f.id} onClick={() => { onAssign(item.id, f.id); setShowAssign(false) }}
                  style={{ padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 6,
                    background: item.assignedTo === f.id ? f.bg : 'transparent',
                    color: item.assignedTo === f.id ? f.tc : '#333' }}>
                  {f.emoji ?? '👤'} {f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => onDelete(item.id)} style={{
          fontSize: 11, padding: '3px 6px', borderRadius: 8, border: '0.5px solid #f09595',
          background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', flexShrink: 0,
        }}>✕</button>
      </div>

      {/* 금액 입력 인라인 폼 */}
      {showBuyForm && !isBought && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            autoFocus
            type="number"
            placeholder="구매 금액 (원)"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmBuy()}
            style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #85B7EB', fontSize: 13 }}
          />
          <button onClick={handleConfirmBuy} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: '#1D9E75', color: '#fff', fontSize: 13, cursor: 'pointer',
          }}>확인</button>
          <button onClick={() => { setShowBuyForm(false); setBuyAmount('') }} style={{
            padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd',
            background: '#f5f5f5', color: '#888', fontSize: 13, cursor: 'pointer',
          }}>취소</button>
        </div>
      )}
    </div>
  )
}

function CheckRow({ item, friends, onToggle, onAssign, onDelete }) {
  const [showAssign, setShowAssign] = useState(false)
  const assignedFriend = friends.find((f) => f.id === item.assignedTo)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 10, marginBottom: 6,
      background: item.done ? '#E1F5EE' : '#f9f9f9',
      border: item.done ? '0.5px solid #A3D9C6' : '0.5px solid #e8e8e8',
      position: 'relative',
    }}>
      <div onClick={() => onToggle(item.id, item.done)} style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
        background: item.done ? '#1D9E75' : '#fff',
        border: item.done ? 'none' : '1.5px solid #ccc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, color: '#fff',
      }}>{item.done ? '✓' : ''}</div>

      <span style={{ flex: 1, fontSize: 14, color: item.done ? '#085041' : '#333', textDecoration: item.done ? 'line-through' : 'none' }}>
        {item.text}
      </span>

      {assignedFriend && (
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: assignedFriend.bg, color: assignedFriend.tc, flexShrink: 0 }}>
          {assignedFriend.name}
        </span>
      )}

      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowAssign(!showAssign)} style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '0.5px solid #e0e0e0',
          background: '#fff', color: '#888', cursor: 'pointer', flexShrink: 0,
        }}>배정</button>
        {showAssign && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 10,
            background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 8, minWidth: 120,
          }}>
            <div onClick={() => { onAssign(item.id, null); setShowAssign(false) }}
              style={{ padding: '6px 10px', fontSize: 13, cursor: 'pointer', color: '#888', borderRadius: 6 }}>
              담당자 없음
            </div>
            {friends.map((f) => (
              <div key={f.id} onClick={() => { onAssign(item.id, f.id); setShowAssign(false) }}
                style={{ padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 6,
                  background: item.assignedTo === f.id ? f.bg : 'transparent',
                  color: item.assignedTo === f.id ? f.tc : '#333' }}>
                {f.emoji ?? '👤'} {f.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => onDelete(item.id)} style={{
        fontSize: 11, padding: '3px 6px', borderRadius: 8, border: '0.5px solid #f09595',
        background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', flexShrink: 0,
      }}>✕</button>
    </div>
  )
}

function AddItemRow({ onAdd }) {
  const [text, setText] = useState('')
  const [show, setShow] = useState(false)

  function handleAdd() {
    if (!text.trim()) return
    onAdd(text)
    setText('')
    setShow(false)
  }

  if (!show) return (
    <button onClick={() => setShow(true)} style={{
      width: '100%', padding: '9px 0', borderRadius: 10, border: '0.5px dashed #ccc',
      background: '#fafafa', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 6,
    }}>+ 항목 추가</button>
  )

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <input autoFocus value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="항목 입력..."
        style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '0.5px solid #ddd', fontSize: 13 }} />
      <button onClick={handleAdd} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, cursor: 'pointer' }}>추가</button>
      <button onClick={() => setShow(false)} style={{ padding: '9px 10px', borderRadius: 10, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', fontSize: 13, cursor: 'pointer' }}>✕</button>
    </div>
  )
}

export default function PrepPage({ me, tripId, onNext }) {
  const { sharedItems, personalItems, loading, addItem, toggleDone, assignTo, deleteItem, seedDefaults, markBought, markAddedToExpense } = usePackingItems(tripId)
  const { addExpense } = useCostItems(tripId)
  const { memberIds } = useTripMembers(tripId)
  const { friends } = useFriends()
  const [tab, setTab] = useState('shared')

  const sharedDone = sharedItems.filter((i) => i.done).length
  const personalDone = personalItems.filter((i) => i.done).length

  const unassigned = personalItems.filter((i) => !i.assignedTo)
  const byFriend = friends.map((f) => ({
    friend: f,
    items: personalItems.filter((i) => i.assignedTo === f.id),
  }))

  async function handleMarkBought(itemId, amount, payerId) {
    const item = sharedItems.find((i) => i.id === itemId)
    if (!item) return
    markBought(itemId, amount, payerId)
    if (!item.addedToExpense) {
      await addExpense(item.text, amount, payerId, memberIds, 'prep', itemId)
      markAddedToExpense(itemId)
    }
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  return (
    <div style={{ padding: '12px 16px 80px' }}>
      {/* 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('shared')} style={{
          flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
          border: '0.5px solid', borderColor: tab === 'shared' ? '#185FA5' : '#e0e0e0',
          background: tab === 'shared' ? '#E6F1FB' : '#f5f5f5',
          color: tab === 'shared' ? '#0C447C' : '#888',
        }}>🛒 공동 구매 ({sharedDone}/{sharedItems.length})</button>
        <button onClick={() => setTab('personal')} style={{
          flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
          border: '0.5px solid', borderColor: tab === 'personal' ? '#185FA5' : '#e0e0e0',
          background: tab === 'personal' ? '#E6F1FB' : '#f5f5f5',
          color: tab === 'personal' ? '#0C447C' : '#888',
        }}>🎒 개인 준비물 ({personalDone}/{personalItems.length})</button>
      </div>

      {sharedItems.length === 0 && personalItems.length === 0 && (
        <button onClick={seedDefaults} style={{
          width: '100%', padding: '11px 0', borderRadius: 10, marginBottom: 14,
          border: '0.5px solid #85B7EB', background: '#E6F1FB', color: '#0C447C',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>📋 기본 준비물 목록 불러오기</button>
      )}

      {tab === 'shared' && (
        <div>
          {sharedItems.length === 0 && (
            <div style={{ color: '#ccc', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>구매할 공동 준비물이 없어요</div>
          )}
          {sharedItems.map((item) => (
            <SharedCheckRow
              key={item.id}
              item={item}
              friends={friends}
              onToggle={toggleDone}
              onAssign={assignTo}
              onDelete={deleteItem}
              me={me}
              onMarkBought={handleMarkBought}
            />
          ))}
          <AddItemRow onAdd={(text) => addItem(text, 'shared')} />
        </div>
      )}

      {tab === 'personal' && (
        <div>
          {unassigned.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 8, letterSpacing: 0.4 }}>미배정</div>
              {unassigned.map((item) => (
                <CheckRow key={item.id} item={item} friends={friends} onToggle={toggleDone} onAssign={assignTo} onDelete={deleteItem} />
              ))}
            </div>
          )}

          {byFriend.map(({ friend, items: friendItems }) => (
            <div key={friend.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: friend.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {friend.emoji ?? friend.name[0]}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: friend.tc }}>
                  {friend.name}
                  <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 6 }}>
                    {friendItems.filter((i) => i.done).length}/{friendItems.length}
                  </span>
                </div>
              </div>
              {friendItems.length === 0 && (
                <div style={{ fontSize: 12, color: '#ccc', paddingLeft: 36, marginBottom: 4 }}>아직 배정된 항목 없음</div>
              )}
              {friendItems.map((item) => (
                <CheckRow key={item.id} item={item} friends={friends} onToggle={toggleDone} onAssign={assignTo} onDelete={deleteItem} />
              ))}
            </div>
          ))}

          <AddItemRow onAdd={(text) => addItem(text, 'personal', me.id)} />
        </div>
      )}

      <button onClick={onNext} style={{
        width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 12,
        border: 'none', background: '#185FA5', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
      }}>
        💸 정산으로 →
      </button>
    </div>
  )
}
