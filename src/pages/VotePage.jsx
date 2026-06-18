import { useState } from 'react'
import { DATE_OPTIONS, MEMBERS } from '../constants'
import { useVotes, useConfirmedDate, usePensions } from '../hooks/useFirebase'

const btn = (color, bg, border) => ({
  width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 14,
  fontWeight: 500, border: border || 'none', background: bg, color,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  marginBottom: 8,
})

export default function VotePage({ me }) {
  const { votes, castVote } = useVotes()
  const { confirmedDate, confirm } = useConfirmedDate()
  const { pensions, addPension, removePension } = usePensions()
  const [filter, setFilter] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', price: '', desc: '' })

  const filtered = filter === 0 ? DATE_OPTIONS : DATE_OPTIONS.filter((d) => d.nights === filter)

  function sendAlarm() {
    const d = confirmedDate ? DATE_OPTIONS.find((x) => x.id === confirmedDate) : null
    const msg = d
      ? `[여행이야? 다들모여~]\n📅 ${d.start}~${d.end} 확정!\n준비물 체크해줘 👍\nhttps://yeohaengiya.netlify.app`
      : `[여행이야? 다들모여~]\n날짜 투표 좀 해줘!\nhttps://yeohaengiya.netlify.app`
    navigator.clipboard.writeText(msg).then(() => alert('카톡 단체방에 붙여넣기해줘!\n\n' + msg))
  }

  function submitPension() {
    if (!form.name.trim()) return alert('펜션 이름을 입력해주세요')
    addPension({ ...form, who: me.name })
    setForm({ name: '', url: '', price: '', desc: '' })
    setShowForm(false)
  }

  return (
    <div style={{ padding: '12px 16px 24px' }}>
      {/* 알림 버튼 */}
      <button style={btn('#0C447C', '#E6F1FB', '0.5px solid #85B7EB')} onClick={sendAlarm}>
        🔔 카카오톡으로 투표 요청 알림 보내기
      </button>

      {/* 날짜 필터 */}
      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, margin: '14px 0 8px', letterSpacing: 0.4 }}>날짜 투표</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[['전체', 0], ['1박 2일', 1], ['2박 3일', 2]].map(([label, val]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, border: '0.5px solid',
            borderColor: filter === val ? '#85B7EB' : '#e0e0e0',
            background: filter === val ? '#E6F1FB' : '#f5f5f5',
            color: filter === val ? '#0C447C' : '#888', fontWeight: filter === val ? 500 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* 날짜 카드 목록 */}
      {filtered.map((d) => {
        const voters = MEMBERS.filter((m) => votes[m.id] === d.id)
        const pct = Math.round((voters.length / MEMBERS.length) * 100)
        const myVote = votes[me.id] === d.id
        const isConfirmed = confirmedDate === d.id

        return (
          <div key={d.id} style={{
            border: isConfirmed ? '2px solid #1D9E75' : myVote ? '2px solid #185FA5' : '0.5px solid #e0e0e0',
            borderRadius: 12, padding: '11px 13px', marginBottom: 8,
            background: isConfirmed ? '#E1F5EE' : myVote ? '#E6F1FB' : '#fff',
            ...(d.note ? { borderLeft: isConfirmed ? undefined : '3px solid #BA7517' } : {}),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 20, fontWeight: 500,
                    background: d.nights === 2 ? '#E6F1FB' : '#FAEEDA',
                    color: d.nights === 2 ? '#0C447C' : '#633806',
                  }}>{d.nights}박{d.nights + 1}일</span>
                  {d.start} ~ {d.end}
                  {isConfirmed && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#E1F5EE', color: '#085041', fontWeight: 500 }}>확정!</span>}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{d.day} · {voters.length}명 ({pct}%)</div>
                {d.note && <div style={{ fontSize: 11, color: '#854F0B', marginTop: 3 }}>⭐ {d.note}</div>}
              </div>
            </div>

            {/* 진행바 + 투표자 */}
            {voters.length > 0 && (
              <>
                <div style={{ height: 4, background: '#eee', borderRadius: 2, margin: '8px 0 5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#185FA5', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {voters.map((m) => (
                    <span key={m.id} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: m.bg, color: m.tc }}>{m.name}</span>
                  ))}
                </div>
              </>
            )}

            {/* 버튼 행 */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {!myVote && (
                <button onClick={() => castVote(me.id, d.id)} style={{
                  flex: 2, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  border: 'none', background: '#185FA5', color: '#E6F1FB',
                }}>이 날짜 투표</button>
              )}
              {myVote && !isConfirmed && (
                <span style={{ flex: 2, textAlign: 'center', fontSize: 12, color: '#185FA5', padding: '7px 0', fontWeight: 500 }}>✓ 내가 투표한 날짜</span>
              )}
              {me.role === '총무' && !isConfirmed && (
                <button onClick={() => confirm(d.id)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12,
                  border: '0.5px solid #1D9E75', background: '#fff', color: '#0F6E56',
                }}>확정</button>
              )}
            </div>
          </div>
        )
      })}

      {/* 펜션 공유 게시판 */}
      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, margin: '16px 0 8px', letterSpacing: 0.4 }}>펜션 공유 게시판</div>

      {pensions.map((p) => (
        <div key={p.key} style={{ border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '12px 14px', marginBottom: 8, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F1EFE8', color: '#444441' }}>{p.who}</span>
          </div>
          {p.desc && <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.5 }}>{p.desc}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{p.price || '가격 미입력'}/박</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {p.url && p.url !== '#' && (
                <a href={p.url} target="_blank" rel="noreferrer" style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 12, border: '0.5px solid #e0e0e0',
                  background: '#f5f5f5', color: '#555', textDecoration: 'none',
                }}>예약 링크 →</a>
              )}
              {p.who === me.name && (
                <button onClick={() => removePension(p.key)} style={{
                  padding: '5px 8px', borderRadius: 8, fontSize: 12,
                  border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D',
                }}>삭제</button>
              )}
            </div>
          </div>
        </div>
      ))}

      {showForm ? (
        <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          {[['name', '펜션 이름'], ['url', '예약 링크 (여기어때·야놀자)'], ['price', '1박 가격 (예: 30만원)']].map(([k, ph]) => (
            <input key={k} placeholder={ph} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              style={{ width: '100%', marginBottom: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }} />
          ))}
          <textarea placeholder="특징 메모 (계곡 바로 앞, 6인 독채 등)" value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            style={{ width: '100%', height: 60, marginBottom: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', resize: 'none', fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888' }}>취소</button>
            <button onClick={submitPension} style={{ flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', background: '#185FA5', color: '#fff' }}>등록하기</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={btn('#555', '#f5f5f5', '0.5px solid #ddd')}>
          + 내가 찾은 펜션 공유하기
        </button>
      )}
    </div>
  )
}
