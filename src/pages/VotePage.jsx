import { useState } from 'react'
import { useVotes, useConfirmedDate, usePensions } from '../hooks/useFirebase'
import { useTripDateOptions, useTripMeta } from '../hooks/useTrips'
import { useFriends } from '../hooks/useFriends'

function PensionSearch({ destination }) {
  const keyword = encodeURIComponent((destination || '펜션') + ' 펜션')
  const sites = [
    { label: '🔍 네이버', url: `https://search.naver.com/search.naver?query=${keyword}` },
    { label: '🏠 여기어때', url: `https://www.yeogi.com/domestic-stays?keyword=${encodeURIComponent(destination || '펜션')}` },
    { label: '🌙 야놀자', url: `https://www.yanolja.com/search?keyword=${keyword}` },
  ]
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 8, letterSpacing: 0.4 }}>
        펜션 검색 {destination ? `— ${destination}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {sites.map((s) => (
          <a key={s.label} href={s.url} target="_blank" rel="noreferrer" style={{
            flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 500,
            border: '0.5px solid #e0e0e0', background: '#f9f9f9', color: '#444',
            textAlign: 'center', textDecoration: 'none', display: 'block',
          }}>{s.label}</a>
        ))}
      </div>
    </div>
  )
}

const btn = (color, bg, border) => ({
  width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 14,
  fontWeight: 500, border: border || 'none', background: bg, color,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  marginBottom: 8, cursor: 'pointer',
})

function DateOptionForm({ onAdd, onCancel }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [nights, setNights] = useState(2)
  const [note, setNote] = useState('')

  function handleSubmit() {
    if (!start.trim() || !end.trim()) return
    onAdd({ start: start.trim(), end: end.trim(), nights: Number(nights), note: note.trim() || null })
  }

  return (
    <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>날짜 후보 추가</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input placeholder="출발일 (예: 7/4(금))" value={start} onChange={(e) => setStart(e.target.value)}
          style={inputStyle} />
        <input placeholder="복귀일 (예: 7/6(일))" value={end} onChange={(e) => setEnd(e.target.value)}
          style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select value={nights} onChange={(e) => setNights(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}>
          <option value={1}>1박 2일</option>
          <option value={2}>2박 3일</option>
          <option value={3}>3박 4일</option>
        </select>
      </div>
      <input placeholder="특이사항 메모 (선택)" value={note} onChange={(e) => setNote(e.target.value)}
        style={{ ...inputStyle, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', cursor: 'pointer' }}>취소</button>
        <button onClick={handleSubmit} style={{ flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer' }}>추가</button>
      </div>
    </div>
  )
}

export default function VotePage({ me, tripId, tripMembers }) {
  const { votes, castVote } = useVotes(tripId)
  const { confirmedDate, confirm } = useConfirmedDate(tripId)
  const { pensions, addPension, removePension } = usePensions(tripId)
  const { options: dateOptions, addOption, removeOption } = useTripDateOptions(tripId)
  const { friends } = useFriends()
  const { meta } = useTripMeta(tripId)

  const [filter, setFilter] = useState(0)
  const [showDateForm, setShowDateForm] = useState(false)
  const [showPensionForm, setShowPensionForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', price: '', desc: '' })

  // 참가자로 필터링된 친구 정보
  const memberMap = Object.fromEntries(friends.map((f) => [f.id, f]))
  const members = tripMembers.map((id) => memberMap[id]).filter(Boolean)
  const memberCount = members.length

  const filtered = filter === 0 ? dateOptions : dateOptions.filter((d) => d.nights === filter)

  function sendAlarm() {
    const d = confirmedDate ? dateOptions.find((x) => x.id === confirmedDate) : null
    const memberNames = members.map((m) => m.name).join('·')
    const msg = d
      ? `[여행이야? 다들모여~]\n📅 ${d.start}~${d.end} 확정!\n준비물 체크해줘 👍\n참가자: ${memberNames}`
      : `[여행이야? 다들모여~]\n날짜 투표 좀 해줘!\n참가자: ${memberNames}`
    navigator.clipboard.writeText(msg).then(() => alert('카톡 단체방에 붙여넣기해줘!\n\n' + msg))
  }

  function submitPension() {
    if (!form.name.trim()) return alert('펜션 이름을 입력해주세요')
    addPension({ ...form, who: me.name })
    setForm({ name: '', url: '', price: '', desc: '' })
    setShowPensionForm(false)
  }

  const isTreasurer = me.role === '총무'

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
            color: filter === val ? '#0C447C' : '#888', fontWeight: filter === val ? 500 : 400, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* 날짜 카드 목록 */}
      {filtered.length === 0 && !showDateForm && (
        <div style={{ color: '#ccc', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
          날짜 후보가 없어요. 아래 버튼으로 추가해주세요.
        </div>
      )}

      {filtered.map((d) => {
        const voters = members.filter((m) => votes[m.id] === d.id)
        const pct = memberCount > 0 ? Math.round((voters.length / memberCount) * 100) : 0
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
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                  가능 {voters.length}명 / {memberCount}명 ({pct}%)
                </div>
                {d.note && <div style={{ fontSize: 11, color: '#854F0B', marginTop: 3 }}>⭐ {d.note}</div>}
              </div>
              {isTreasurer && !isConfirmed && !confirmedDate && (
                <button onClick={() => removeOption(d.id)} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 8,
                  border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer',
                }}>삭제</button>
              )}
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
              {!myVote && !isConfirmed && (
                <button onClick={() => castVote(me.id, d.id)} style={{
                  flex: 2, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  border: 'none', background: '#185FA5', color: '#E6F1FB', cursor: 'pointer',
                }}>이 날짜 투표</button>
              )}
              {myVote && !isConfirmed && (
                <span style={{ flex: 2, textAlign: 'center', fontSize: 12, color: '#185FA5', padding: '7px 0', fontWeight: 500 }}>✓ 내가 투표한 날짜</span>
              )}
              {isTreasurer && !isConfirmed && !confirmedDate && (
                <button onClick={() => confirm(d.id)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12,
                  border: '0.5px solid #1D9E75', background: '#fff', color: '#0F6E56', cursor: 'pointer',
                }}>확정</button>
              )}
            </div>
          </div>
        )
      })}

      {/* 날짜 후보 추가 */}
      {showDateForm ? (
        <DateOptionForm onAdd={(data) => { addOption(data); setShowDateForm(false) }} onCancel={() => setShowDateForm(false)} />
      ) : (
        <button style={btn('#555', '#f5f5f5', '0.5px solid #ddd')} onClick={() => setShowDateForm(true)}>
          + 날짜 후보 추가
        </button>
      )}

      {/* 펜션 검색 + 공유 게시판 */}
      <div style={{ margin: '16px 0 8px' }}>
        <PensionSearch destination={meta?.destination} />
      </div>
      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 8, letterSpacing: 0.4 }}>펜션 공유 게시판</div>

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
                  border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer',
                }}>삭제</button>
              )}
            </div>
          </div>
        </div>
      ))}

      {showPensionForm ? (
        <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          {[['name', '펜션 이름'], ['url', '예약 링크 (여기어때·야놀자)'], ['price', '1박 가격 (예: 30만원)']].map(([k, ph]) => (
            <input key={k} placeholder={ph} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              style={{ width: '100%', marginBottom: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
          ))}
          <textarea placeholder="특징 메모 (계곡 바로 앞, 6인 독채 등)" value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            style={{ width: '100%', height: 60, marginBottom: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', resize: 'none', fontSize: 13, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowPensionForm(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', cursor: 'pointer' }}>취소</button>
            <button onClick={submitPension} style={{ flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer' }}>등록하기</button>
          </div>
        </div>
      ) : (
        <button style={btn('#555', '#f5f5f5', '0.5px solid #ddd')} onClick={() => setShowPensionForm(true)}>
          + 내가 찾은 펜션 공유하기
        </button>
      )}
    </div>
  )
}

const inputStyle = { flex: 1, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box' }
