import { useState } from 'react'
import { COST_ITEMS } from '../constants'

const HEAD_COUNT = 6

export default function CostPage() {
  const [nights, setNights] = useState(2)
  // 펜션 1박 가격 (총액)
  const [pensionTotal, setPensionTotal] = useState(300000)
  // 항목별 1인당 금액 오버라이드
  const [overrides, setOverrides] = useState({})

  function amount(item) {
    if (overrides[item.id] !== undefined) return Number(overrides[item.id])
    if (item.perNight) return Math.round((pensionTotal * nights) / HEAD_COUNT)
    return item.amount
  }

  const total = COST_ITEMS.reduce((sum, item) => sum + amount(item), 0)

  return (
    <div style={{ padding: '12px 16px 32px' }}>
      {/* 박수 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2].map((n) => (
          <button key={n} onClick={() => setNights(n)} style={{
            flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
            border: '0.5px solid',
            borderColor: nights === n ? '#185FA5' : '#e0e0e0',
            background: nights === n ? '#E6F1FB' : '#f5f5f5',
            color: nights === n ? '#0C447C' : '#888',
          }}>{n}박 {n + 1}일</button>
        ))}
      </div>

      {/* 펜션 총액 입력 */}
      <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>펜션 {nights}박 총 금액 (원)</div>
        <input
          type="number"
          value={pensionTotal}
          onChange={(e) => setPensionTotal(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14 }}
        />
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
          1인당 → {((pensionTotal * nights) / HEAD_COUNT).toLocaleString()}원
        </div>
      </div>

      {/* 항목 목록 */}
      {COST_ITEMS.filter((i) => !i.perNight).map((item) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
          <span style={{ fontSize: 14, color: '#444' }}>{item.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              value={overrides[item.id] ?? item.amount}
              onChange={(e) => setOverrides({ ...overrides, [item.id]: e.target.value })}
              style={{ width: 90, padding: '5px 8px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, textAlign: 'right' }}
            />
            <span style={{ fontSize: 12, color: '#aaa' }}>원</span>
          </div>
        </div>
      ))}

      {/* 합계 */}
      <div style={{ marginTop: 20, background: '#E6F1FB', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>6명 · {nights}박 {nights + 1}일 · 1인당 예상</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#0C447C' }}>
          {total.toLocaleString()}원
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          총 {(total * HEAD_COUNT).toLocaleString()}원 (6인 합산)
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: '#bbb', lineHeight: 1.7, textAlign: 'center' }}>
        실제 금액 입력 후 병수(총무)가 정산 확정해줘 💰
      </div>
    </div>
  )
}
