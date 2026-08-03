import { useState } from 'react'
import { useCostItems } from '../hooks/useCostItems'
import { useVehicles } from '../hooks/useVehicles'
import { useBoard } from '../hooks/useBoard'
import { useFriends } from '../hooks/useFriends'
import { useTripMeta } from '../hooks/useTrips'
import { useConfirmedDate } from '../hooks/useFirebase'

function fmtAmt(n) {
  const v = Math.round(Number(n) || 0)
  if (v === 0) return '0원'
  const man = Math.floor(v / 10000)
  const rest = v % 10000
  if (man > 0 && rest === 0) return `${man.toLocaleString()}만원`
  if (man > 0) return `${man.toLocaleString()}만 ${rest.toLocaleString()}원`
  return `${rest.toLocaleString()}원`
}

function StatCard({ icon, title, main, sub, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '13px 14px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>{icon} {title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2, wordBreak: 'break-all' }}>{main}</div>
      {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 5, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

export default function SummaryPage({ tripId, tripMembers }) {
  const { items: costItems } = useCostItems(tripId)
  const { vehicles } = useVehicles(tripId)
  const { posts, todos } = useBoard(tripId)
  const { friends } = useFriends()
  const { meta } = useTripMeta(tripId)
  const { confirmedDate } = useConfirmedDate(tripId)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  const memberMap = Object.fromEntries(friends.map(f => [f.id, f]))
  const memberIds = tripMembers || []

  // ── 경비 ─────────────────────────────────────────────────────
  const totalSpent = costItems.reduce((s, i) => s + (i.totalAmount || 0), 0)
  const payerTotals = {}
  costItems.forEach(i => {
    if (i.payerId) payerTotals[i.payerId] = (payerTotals[i.payerId] || 0) + (i.totalAmount || 0)
  })
  const topPayerId = Object.entries(payerTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topPayer = topPayerId ? memberMap[topPayerId] : null

  // ── 이동 ─────────────────────────────────────────────────────
  const totalKm = vehicles.reduce((s, v) => {
    const d = Number(v.distanceKm || 0)
    return s + (v.isRoundTrip ? d * 2 : d)
  }, 0)
  const destinations = [...new Set(
    vehicles.flatMap(v => [v.departure, ...(v.waypoints || []), v.destination]).filter(Boolean)
  )]

  // ── 게시판 ───────────────────────────────────────────────────
  const totalLikes = posts.reduce((s, p) => s + Object.keys(p.likes || {}).length, 0)
  const totalReplies = posts.reduce((s, p) => s + Object.keys(p.replies || {}).length, 0)
  const topPost = [...posts].sort((a, b) => Object.keys(b.likes || {}).length - Object.keys(a.likes || {}).length)[0]

  const postCounts = {}
  posts.forEach(p => { postCounts[p.memberId] = (postCounts[p.memberId] || 0) + 1 })
  const topPosterId = Object.entries(postCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const likesReceived = {}
  posts.forEach(p => {
    const cnt = Object.keys(p.likes || {}).length
    if (cnt > 0) likesReceived[p.memberId] = (likesReceived[p.memberId] || 0) + cnt
  })
  const topLikedId = Object.entries(likesReceived).sort((a, b) => b[1] - a[1])[0]?.[0]

  // ── 체크리스트 ───────────────────────────────────────────────
  const todoRate = todos.length > 0 ? Math.round(todos.filter(t => t.done).length / todos.length * 100) : 0
  const todoDoneCounts = {}
  todos.filter(t => t.done && t.doneBy).forEach(t => {
    todoDoneCounts[t.doneBy] = (todoDoneCounts[t.doneBy] || 0) + 1
  })
  const topDoerId = Object.entries(todoDoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  // ── MVP ──────────────────────────────────────────────────────
  const mvps = [
    { emoji: '💸', title: '지갑왕', member: memberMap[topPayerId], desc: topPayerId ? fmtAmt(payerTotals[topPayerId]) : null },
    { emoji: '💬', title: '수다왕', member: memberMap[topPosterId], desc: topPosterId ? `글 ${postCounts[topPosterId]}개` : null },
    { emoji: '❤️', title: '인싸', member: memberMap[topLikedId], desc: topLikedId ? `좋아요 ${likesReceived[topLikedId]}개` : null },
    { emoji: '✅', title: '준비왕', member: memberMap[topDoerId], desc: topDoerId ? `${todoDoneCounts[topDoerId]}개 완료` : null },
  ].filter(m => m.member)

  // ── AI 요약 ──────────────────────────────────────────────────
  async function requestAiSummary() {
    setAiLoading(true)
    setAiError(null)
    setAiText('')
    try {
      const res = await fetch('/.netlify/functions/trip-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meta?.title || '여행',
          date: confirmedDate || '미정',
          members: memberIds.map(id => memberMap[id]?.name).filter(Boolean).join(', '),
          totalSpent,
          topPayerName: topPayer?.name || null,
          expenses: costItems.slice(0, 6).map(i => `${i.label} ${fmtAmt(i.totalAmount)}`).join(', '),
          routes: vehicles.map(v => [v.departure, ...(v.waypoints || []), v.destination].filter(Boolean).join(' → ')).join(' / '),
          totalKm,
          postCount: posts.length,
          totalLikes,
          topPostContent: topPost?.content?.slice(0, 80) || null,
          todoRate,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiText(data.summary)
    } catch (e) {
      setAiError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const hasData = totalSpent > 0 || vehicles.length > 0 || posts.length > 0

  return (
    <div style={{ padding: '12px 16px 40px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#222' }}>✈️ {meta?.title || '여행 리포트'}</div>
        {confirmedDate && (
          <div style={{ fontSize: 12, color: '#185FA5', marginTop: 3 }}>🗓️ {confirmedDate} 확정</div>
        )}
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
          👥 {memberIds.map(id => memberMap[id]?.name).filter(Boolean).join(' · ')}
        </div>
      </div>

      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
          아직 데이터가 없어요 😊<br />경비·차량·게시판을 채우면<br />여기에 여행 통계가 뜹니다
        </div>
      ) : (
        <>
          {/* 통계 2×2 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <StatCard icon="💰" title="총 경비"
              main={totalSpent > 0 ? fmtAmt(totalSpent) : '—'}
              sub={topPayer ? `💸 ${topPayer.name}이 가장 많이 냄` : undefined}
              color="#085041" bg="#E1F5EE"
            />
            <StatCard icon="🚗" title="이동 거리"
              main={totalKm > 0 ? `${totalKm}km` : '—'}
              sub={destinations.slice(0, 2).join(' · ') || undefined}
              color="#0C447C" bg="#E6F1FB"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <StatCard icon="💬" title="대화"
              main={posts.length > 0 ? `${posts.length}개 글` : '—'}
              sub={posts.length > 0 ? `❤️ ${totalLikes} · 💬 ${totalReplies}` : undefined}
              color="#633806" bg="#FAEEDA"
            />
            <StatCard icon="✅" title="준비물"
              main={todos.length > 0 ? `${todoRate}%` : '—'}
              sub={todos.length > 0 ? `${todos.filter(t => t.done).length}/${todos.length}개` : undefined}
              color="#1D9E75" bg="#E1F5EE"
            />
          </div>

          {/* MVP */}
          {mvps.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>👑 이번 여행 MVP</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {mvps.map((mvp, i) => (
                  <div key={i} style={{
                    background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12,
                    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 18 }}>{mvp.emoji}</span>
                    <div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{mvp.title}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{mvp.member.name}</div>
                      {mvp.desc && <div style={{ fontSize: 10, color: '#185FA5' }}>{mvp.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 인기글 */}
          {topPost && Object.keys(topPost.likes || {}).length > 0 && (
            <div style={{
              background: '#FFFBE6', border: '0.5px solid #E0C97A', borderRadius: 12,
              padding: '11px 13px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: '#856404', marginBottom: 5 }}>❤️ 가장 인기 있는 게시글</div>
              <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {topPost.content.length > 120 ? topPost.content.slice(0, 120) + '…' : topPost.content}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
                {memberMap[topPost.memberId]?.name} · ❤️ {Object.keys(topPost.likes || {}).length}
              </div>
            </div>
          )}
        </>
      )}

      {/* AI 요약 */}
      <div style={{ borderTop: '0.5px solid #f0f0f0', paddingTop: 16 }}>
        <div style={{ fontSize: 12, color: '#777', marginBottom: 10, lineHeight: 1.6 }}>
          ✨ AI가 우리 여행 이야기를 재미있게 풀어줍니다
        </div>
        <button
          onClick={requestAiSummary}
          disabled={aiLoading}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
            background: aiLoading ? '#d0e4f7' : '#185FA5',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: aiLoading ? 'default' : 'pointer',
            letterSpacing: 0.3,
          }}
        >
          {aiLoading ? '✍️ AI가 이야기 쓰는 중...' : '✨ AI 여행 이야기 써주기'}
        </button>

        {aiError && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#A32D2D', textAlign: 'center', lineHeight: 1.6 }}>
            {aiError === 'API 키 미설정'
              ? 'Netlify 환경변수에 ANTHROPIC_API_KEY를 설정해주세요'
              : `오류: ${aiError}`}
          </div>
        )}

        {aiText && (
          <div style={{
            marginTop: 14, background: '#f9f9f9', border: '0.5px solid #e0e0e0',
            borderRadius: 14, padding: '16px 16px',
            fontSize: 14, color: '#333', lineHeight: 1.9,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {aiText}
          </div>
        )}
      </div>
    </div>
  )
}
