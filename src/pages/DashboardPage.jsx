import { useTripMeta, useTripDateOptions } from '../hooks/useTrips'
import { usePreferences } from '../hooks/usePreferences'
import { useConfirmedPension } from '../hooks/useConfirmedPension'
import { usePackingItems } from '../hooks/usePackingItems'
import { useCostItems } from '../hooks/useCostItems'
import { usePensions } from '../hooks/useFirebase'

// 날짜 문자열 → Date 파싱 ("M/D(요일)" 또는 ISO)
function parseDate(str) {
  if (!str) return null
  if (str.includes('-')) return new Date(str)
  // "7/4(금)" 형식
  const m = str.match(/(\d+)\/(\d+)/)
  if (m) {
    const year = new Date().getFullYear()
    return new Date(year, parseInt(m[1]) - 1, parseInt(m[2]))
  }
  return null
}

function dDay(dateStr) {
  const d = parseDate(dateStr)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.floor((d - today) / 86400000)
}

const card = (borderColor) => ({
  background: '#fff', borderRadius: 10,
  borderLeft: `4px solid ${borderColor}`,
  padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
})

const label = { fontSize: 11, color: '#999', marginBottom: 4 }
const big = { fontSize: 22, fontWeight: 700, color: '#1a1a2e' }

export default function DashboardPage({ me, tripId, tripMembers, onNavigate }) {
  const { meta } = useTripMeta(tripId)
  const { options } = useTripDateOptions(tripId)
  const { preferences } = usePreferences(tripId)
  const { confirmedPension } = useConfirmedPension(tripId)
  const { pensions } = usePensions(tripId)
  const { items: packingItems } = usePackingItems(tripId)
  const { items: costItems } = useCostItems(tripId)

  const totalMembers = tripMembers.length || 1

  // D-day
  const confirmedDateId = meta?.confirmedDate
  const confirmedOption = options.find((o) => o.id === confirmedDateId)
  const confirmedDateStr = confirmedOption?.startIso || confirmedOption?.label
  const ddayVal = dDay(confirmedDateStr)
  const ddayText = ddayVal == null
    ? '날짜 미확정'
    : ddayVal === 0 ? 'D-day!' : `D-${ddayVal}`

  // 날짜 투표율 (한 명이라도 preference 던진 비율)
  const votedCount = tripMembers.filter((mId) => {
    return options.some((o) => preferences[o.id]?.[mId])
  }).length
  const voteRatio = Math.round((votedCount / totalMembers) * 100)

  // 미투표 수
  const notVoted = totalMembers - votedCount

  // 준비물 완료율
  const totalPacking = packingItems.length
  const donePacking = packingItems.filter((i) => i.done).length
  const packingPct = totalPacking > 0 ? Math.round((donePacking / totalPacking) * 100) : 0

  // 예상 1인 비용
  const totalCost = costItems.reduce((s, i) => s + (i.totalAmount || 0), 0)
  const perPerson = totalMembers > 0 ? Math.round(totalCost / totalMembers / 10000) : 0

  // 내 할 일 (미완료 담당 아이템)
  const myTodos = packingItems.filter((i) => i.assignedTo === me?.id && !i.done).slice(0, 3)

  // 확정 펜션 이름
  const confirmedPensionObj = pensions.find((p) => p.key === confirmedPension)

  const dateLabel = confirmedOption
    ? (confirmedOption.startIso || confirmedOption.label || '날짜 확정')
    : `투표 진행 중 (${voteRatio}%)`

  return (
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#185FA5' }}>
        {meta?.title || '여행 대시보드'} 📊
      </h2>

      {/* KPI 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>

        {/* D-day */}
        <div style={card('#185FA5')}>
          <div style={label}>D-day</div>
          <div style={{ ...big, color: ddayVal === 0 ? '#e53e3e' : '#185FA5' }}>{ddayText}</div>
        </div>

        {/* 참가자 */}
        <div style={card('#38a169')}>
          <div style={label}>참가자</div>
          <div style={big}>{totalMembers}명 확정</div>
        </div>

        {/* 날짜 */}
        <div style={card('#d69e2e')}>
          <div style={label}>날짜</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#744210' }}>{dateLabel}</div>
        </div>

        {/* 준비물 */}
        <div style={card('#805ad5')}>
          <div style={label}>준비물 완료율</div>
          <div style={{ ...big, fontSize: 18 }}>{packingPct}%</div>
          <div style={{ background: '#e9d8fd', borderRadius: 4, height: 6, marginTop: 6 }}>
            <div style={{ background: '#805ad5', width: `${packingPct}%`, height: '100%', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{donePacking}/{totalPacking} 완료</div>
        </div>

        {/* 미투표 */}
        <div style={card('#e53e3e')}>
          <div style={label}>미투표</div>
          <div style={big}>{notVoted}명</div>
        </div>

        {/* 예상 비용 */}
        <div style={card('#319795')}>
          <div style={label}>예상 1인 비용</div>
          <div style={{ ...big, fontSize: 18 }}>약 {perPerson}만원</div>
        </div>

      </div>

      {/* 확정 숙소 */}
      {confirmedPension && (
        <div style={{ ...card('#f6ad55'), marginBottom: 12 }}>
          <div style={label}>확정 숙소</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#7b341e' }}>
            {confirmedPensionObj?.name || confirmedPension}
          </div>
        </div>
      )}

      {/* 내 할 일 */}
      <div style={{ ...card('#4a5568'), marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748', marginBottom: 8 }}>내 할 일</div>
        {myTodos.length === 0
          ? <div style={{ color: '#68d391', fontSize: 14 }}>모두 완료! 🎉</div>
          : myTodos.map((item) => (
            <div key={item.id} style={{ fontSize: 13, color: '#4a5568', padding: '4px 0', borderBottom: '1px solid #eee' }}>
              • {item.text}
            </div>
          ))
        }
      </div>

      {/* 빠른 이동 버튼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: '📅 날짜 투표', step: 'vote' },
          { label: '🏡 펜션', step: 'vote' },
          { label: '🎒 준비물', step: 'prep' },
          { label: '💸 정산', step: 'cost' },
        ].map(({ label: l, step }) => (
          <button key={l} onClick={() => onNavigate(step)} style={{
            padding: '10px 0', border: '1px solid #e2e8f0', borderRadius: 8,
            background: '#f7fafc', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
