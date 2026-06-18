import { useState } from 'react'
import { useCostItems } from '../hooks/useCostItems'
import { usePackingItems } from '../hooks/usePackingItems'

function AddItemRow({ onAdd, packingItems }) {
  const [show, setShow] = useState(false)
  const [label, setLabel] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  function handleAdd() {
    if (!label.trim() || !totalAmount) return
    onAdd(label.trim(), totalAmount)
    setLabel('')
    setTotalAmount('')
    setShow(false)
    setShowPicker(false)
  }

  function pickPrep(text) {
    setLabel(text)
    setShowPicker(false)
  }

  if (!show) return (
    <button onClick={() => setShow(true)} style={{
      width: '100%', padding: '9px 0', borderRadius: 10, border: '0.5px dashed #ccc',
      background: '#fafafa', color: '#888', fontSize: 13, cursor: 'pointer', marginTop: 4,
    }}>+ 항목 추가</button>
  )

  return (
    <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="항목 이름"
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }}
          />
          <button onClick={() => setShowPicker(!showPicker)} style={{
            padding: '8px 10px', borderRadius: 8, border: '0.5px solid #85B7EB',
            background: '#E6F1FB', color: '#0C447C', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>준비물 선택</button>
        </div>

        {/* 준비물 피커 드롭다운 */}
        {showPicker && packingItems.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
            background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
            marginTop: 4,
          }}>
            {packingItems.map((item) => (
              <div key={item.id} onClick={() => pickPrep(item.text)} style={{
                padding: '9px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '0.5px solid #f5f5f5',
                color: '#333',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {item.text}
                <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>
                  {item.category === 'shared' ? '공동' : '개인'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="number"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="총 금액 (원)"
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }}
        />
        <button onClick={handleAdd} style={{
          padding: '8px 14px', borderRadius: 8, border: 'none', background: '#185FA5',
          color: '#fff', fontSize: 13, cursor: 'pointer',
        }}>추가</button>
        <button onClick={() => { setShow(false); setShowPicker(false) }} style={{
          padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd',
          background: '#f5f5f5', color: '#888', fontSize: 13, cursor: 'pointer',
        }}>✕</button>
      </div>
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
        총 금액 입력 → 인원수로 나눠 1인당 금액 계산
      </div>
    </div>
  )
}

export default function CostPage({ tripId, tripMembers }) {
  const headCount = tripMembers.length || 1
  const [nights, setNights] = useState(2)
  const [pensionTotal, setPensionTotal] = useState(300000)
  const { items, loading, addItem, updateAmount, deleteItem, seedDefaults } = useCostItems(tripId)
  const { sharedItems, personalItems } = usePackingItems(tripId)

  const allPackingItems = [...sharedItems, ...personalItems]
  const pensionPerPerson = Math.round((Number(pensionTotal) * nights) / headCount)
  const itemsTotal = items.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)
  const total = pensionPerPerson + Math.round(itemsTotal / headCount)

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  return (
    <div style={{ padding: '12px 16px 32px' }}>
      {/* 참가자 수 */}
      <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#555' }}>
        👥 참가자: <strong>{headCount}명</strong>
        {tripMembers.length === 0 && <span style={{ color: '#f09595', marginLeft: 6 }}>(참가자를 먼저 설정해주세요)</span>}
      </div>

      {/* 박수 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2].map((n) => (
          <button key={n} onClick={() => setNights(n)} style={{
            flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
            border: '0.5px solid', borderColor: nights === n ? '#185FA5' : '#e0e0e0',
            background: nights === n ? '#E6F1FB' : '#f5f5f5',
            color: nights === n ? '#0C447C' : '#888', cursor: 'pointer',
          }}>{n}박 {n + 1}일</button>
        ))}
      </div>

      {/* 펜션 총액 */}
      <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>🏡 펜션 {nights}박 총 금액 (원)</div>
        <input
          type="number"
          value={pensionTotal}
          onChange={(e) => setPensionTotal(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}
        />
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
          1인당 → {pensionPerPerson.toLocaleString()}원
        </div>
      </div>

      {/* 기본 항목 불러오기 */}
      {items.length === 0 && (
        <button onClick={() => seedDefaults(headCount)} style={{
          width: '100%', padding: '10px 0', borderRadius: 10, marginBottom: 12,
          border: '0.5px solid #85B7EB', background: '#E6F1FB', color: '#0C447C',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>📋 기본 정산 항목 불러오기</button>
      )}

      {/* 항목 목록 */}
      {items.map((item) => {
        const perPerson = Math.round((Number(item.totalAmount) || 0) / headCount)
        return (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 10, marginBottom: 6,
            background: '#f9f9f9', border: '0.5px solid #eee',
          }}>
            <span style={{ flex: 1, fontSize: 14, color: '#444' }}>{item.label}</span>
            <input
              type="number"
              value={item.totalAmount ?? ''}
              onChange={(e) => updateAmount(item.id, e.target.value)}
              style={{ width: 100, padding: '5px 8px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, textAlign: 'right' }}
            />
            <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>원</span>
            <span style={{ fontSize: 11, color: '#888', flexShrink: 0, background: '#eee', padding: '2px 7px', borderRadius: 8 }}>
              1인 {perPerson.toLocaleString()}
            </span>
            <button onClick={() => deleteItem(item.id)} style={{
              fontSize: 11, padding: '3px 6px', borderRadius: 8, border: '0.5px solid #f09595',
              background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', flexShrink: 0,
            }}>✕</button>
          </div>
        )
      })}

      <AddItemRow onAdd={addItem} packingItems={allPackingItems} />

      {/* 합계 */}
      <div style={{ marginTop: 20, background: '#E6F1FB', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
          {headCount}명 · {nights}박 {nights + 1}일 · 1인당 예상
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#0C447C' }}>
          {total.toLocaleString()}원
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          총 {(total * headCount).toLocaleString()}원 ({headCount}인 합산)
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: '#bbb', lineHeight: 1.7, textAlign: 'center' }}>
        실제 금액 입력 후 총무가 정산 확정해줘 💰
      </div>
    </div>
  )
}
