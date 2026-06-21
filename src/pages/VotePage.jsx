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

// 펜션 링크 자동 미리보기
function PensionForm({ me, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', url: '', price: '', desc: '' })
  const [preview, setPreview] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  async function handlePreview() {
    if (!form.url.trim()) return
    setFetching(true)
    setFetchError(null)
    try {
      const res = await fetch(`/.netlify/functions/og-preview?url=${encodeURIComponent(form.url.trim())}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPreview(data)
      setForm((f) => ({
        ...f,
        name: f.name || data.title || '',
        desc: f.desc || data.description || '',
        price: f.price || data.price || '',
      }))
    } catch (e) {
      setFetchError('링크에서 정보를 가져오지 못했어요. 직접 입력해주세요.')
    } finally {
      setFetching(false)
    }
  }

  function handleSubmit() {
    if (!form.name.trim()) return alert('펜션 이름을 입력해주세요')
    onSubmit({ ...form, previewImage: preview?.image || null, who: me.name })
  }

  return (
    <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: '14px', marginBottom: 8 }}>
      {/* URL + 미리보기 버튼 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          placeholder="🔗 예약 링크 붙여넣기 (여기어때·야놀자·네이버)"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          style={inp}
        />
        <button
          onClick={handlePreview}
          disabled={fetching || !form.url.trim()}
          style={{
            padding: '9px 12px', borderRadius: 8, border: 'none',
            background: fetching ? '#ccc' : '#185FA5', color: '#fff',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          {fetching ? '조회 중...' : '자동 입력'}
        </button>
      </div>

      {fetchError && (
        <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8, padding: '6px 10px', background: '#FCEBEB', borderRadius: 6 }}>
          {fetchError}
        </div>
      )}

      {/* 미리보기 이미지 */}
      {preview?.image && (
        <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', maxHeight: 180 }}>
          <img
            src={preview.image}
            alt="펜션 미리보기"
            style={{ width: '100%', objectFit: 'cover', maxHeight: 180 }}
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}

      {/* 나머지 필드 */}
      <input placeholder="펜션 이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inp, marginBottom: 8 }} />
      <input placeholder="1박 가격 (예: 30만원)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ ...inp, marginBottom: 8 }} />
      <textarea
        placeholder="특징 메모 (계곡 앞, 6인 독채, 바베큐 가능 등)"
        value={form.desc}
        onChange={(e) => setForm({ ...form, desc: e.target.value })}
        style={{ ...inp, height: 60, resize: 'none', marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={cancelBtn}>취소</button>
        <button onClick={handleSubmit} style={submitBtn}>등록하기</button>
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

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']
function fmtKo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_KO[d.getDay()]})`
}

function DateOptionForm({ onAdd, onCancel }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')

  const nights = (startDate && endDate)
    ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000)
    : 0

  function handleSubmit() {
    if (!startDate || !endDate) return alert('날짜를 선택해주세요')
    if (nights <= 0) return alert('복귀일이 출발일보다 늦어야 해요')
    onAdd({ start: fmtKo(startDate), end: fmtKo(endDate), nights, note: note.trim() || null })
  }

  return (
    <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: '14px', marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 500 }}>날짜 후보 추가</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>출발일</div>
          <input type="date" value={startDate}
            onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate('') }}
            style={{ ...inp, width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>복귀일</div>
          <input type="date" value={endDate} min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ ...inp, width: '100%' }} />
        </div>
      </div>
      {nights > 0 && (
        <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 13, color: '#0C447C', fontWeight: 500 }}>
          📅 {fmtKo(startDate)} ~ {fmtKo(endDate)} &nbsp;·&nbsp; {nights}박 {nights + 1}일
        </div>
      )}
      <input placeholder="메모 (선택, 예: 주말 피크 시즌)" value={note}
        onChange={(e) => setNote(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={cancelBtn}>취소</button>
        <button onClick={handleSubmit} style={submitBtn} disabled={nights <= 0}>추가</button>
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

  const memberMap = Object.fromEntries(friends.map((f) => [f.id, f]))
  const members = tripMembers.map((id) => memberMap[id]).filter(Boolean)
  const memberCount = members.length
  const isTreasurer = me.role === '총무'

  const filters = [...new Set([0, ...dateOptions.map(d => d.nights)])]
  const filtered = filter === 0 ? dateOptions : dateOptions.filter((d) => d.nights === filter)

  function sendAlarm() {
    const d = confirmedDate ? dateOptions.find((x) => x.id === confirmedDate) : null
    const memberNames = members.map((m) => m.name).join('·')
    const msg = d
      ? `[여행이야? 다들모여~]\n📅 ${d.start}~${d.end} 확정!\n준비물 체크해줘 👍\n참가자: ${memberNames}`
      : `[여행이야? 다들모여~]\n날짜 투표 좀 해줘!\n참가자: ${memberNames}`
    navigator.clipboard.writeText(msg).then(() => alert('카톡 단체방에 붙여넣기해줘!\n\n' + msg))
  }

  return (
    <div style={{ padding: '12px 16px 24px' }}>
      <button style={btn('#0C447C', '#E6F1FB', '0.5px solid #85B7EB')} onClick={sendAlarm}>
        🔔 카카오톡으로 투표 요청 알림 보내기
      </button>

      {/* 날짜 필터 */}
      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, margin: '14px 0 8px', letterSpacing: 0.4 }}>날짜 투표</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {filters.map((val) => {
          const label = val === 0 ? '전체' : `${val}박 ${val + 1}일`
          return (
            <button key={val} onClick={() => setFilter(val)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, border: '0.5px solid',
              borderColor: filter === val ? '#85B7EB' : '#e0e0e0',
              background: filter === val ? '#E6F1FB' : '#f5f5f5',
              color: filter === val ? '#0C447C' : '#888', fontWeight: filter === val ? 500 : 400, cursor: 'pointer',
            }}>{label}</button>
          )
        })}
      </div>

      {/* 날짜 카드 */}
      {filtered.length === 0 && !showDateForm && (
        <div style={{ color: '#ccc', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
          날짜 후보가 없어요. 아래 버튼으로 추가해주세요.
        </div>
      )}

      {filtered.map((d) => {
        const voters = members.filter((m) => votes[m.id] === d.id)
        const nonVoters = members.filter((m) => !votes[m.id])
        const pct = memberCount > 0 ? Math.round((voters.length / memberCount) * 100) : 0
        const myVote = votes[me.id] === d.id
        const isConfirmed = confirmedDate === d.id

        return (
          <div key={d.id} style={{
            border: isConfirmed ? '2px solid #1D9E75' : myVote ? '2px solid #185FA5' : '0.5px solid #e0e0e0',
            borderRadius: 12, padding: '11px 13px', marginBottom: 8,
            background: isConfirmed ? '#E1F5EE' : myVote ? '#E6F1FB' : '#fff',
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
                  {nonVoters.length > 0 && !isConfirmed && (
                    <span style={{ color: '#f09595', marginLeft: 6 }}>미투표 {nonVoters.length}명</span>
                  )}
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

            {/* 진행바 */}
            <div style={{ height: 4, background: '#eee', borderRadius: 2, margin: '8px 0 6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isConfirmed ? '#1D9E75' : '#185FA5', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>

            {/* 투표한 사람 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {voters.map((m) => (
                <span key={m.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: m.bg, color: m.tc }}>
                  ✓ {m.name}
                </span>
              ))}
              {nonVoters.map((m) => (
                <span key={m.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f5f5f5', color: '#bbb' }}>
                  {m.name}
                </span>
              ))}
            </div>

            {/* 버튼 행 */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {!myVote && !isConfirmed && (
                <button onClick={() => castVote(me.id, d.id)} style={{
                  flex: 2, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer',
                }}>✋ 이 날짜 선택</button>
              )}
              {myVote && !isConfirmed && (
                <span style={{ flex: 2, textAlign: 'center', fontSize: 13, color: '#185FA5', padding: '8px 0', fontWeight: 600 }}>✓ 내가 선택한 날짜</span>
              )}
              {isTreasurer && !isConfirmed && !confirmedDate && (
                <button onClick={() => confirm(d.id)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12,
                  border: '0.5px solid #1D9E75', background: '#fff', color: '#0F6E56', cursor: 'pointer',
                }}>📌 확정</button>
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

      {/* 참가자별 투표 현황 */}
      {members.length > 0 && dateOptions.length > 0 && (
        <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginTop: 4, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 10, letterSpacing: 0.4 }}>참가자별 선택 현황</div>
          {members.map((m) => {
            const votedId = votes[m.id]
            const votedDate = votedId ? dateOptions.find((d) => d.id === votedId) : null
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #eee' }}>
                <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 20, background: m.bg, color: m.tc, flexShrink: 0, fontWeight: 500 }}>
                  {m.name}
                </span>
                <span style={{ fontSize: 13, color: votedDate ? '#333' : '#f09595', flex: 1 }}>
                  {votedDate ? `${votedDate.start} ~ ${votedDate.end}` : '미선택'}
                </span>
                {/* 본인이면 선택 변경 가능 */}
                {m.id === me.id && votedDate && !confirmedDate && (
                  <button onClick={() => castVote(me.id, null)} style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '0.5px solid #ddd',
                    background: '#fff', color: '#888', cursor: 'pointer',
                  }}>변경</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 펜션 검색 */}
      <div style={{ margin: '8px 0 8px' }}>
        <PensionSearch destination={meta?.destination} />
      </div>
      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 8, letterSpacing: 0.4 }}>펜션 공유 게시판</div>

      {pensions.map((p) => (
        <div key={p.key} style={{ border: '0.5px solid #e0e0e0', borderRadius: 12, marginBottom: 8, background: '#fff', overflow: 'hidden' }}>
          {/* 미리보기 이미지 */}
          {p.previewImage && (
            <img src={p.previewImage} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
              onError={(e) => e.target.style.display = 'none'} />
          )}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{p.name}</div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F1EFE8', color: '#444', flexShrink: 0, marginLeft: 8 }}>{p.who}</span>
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
        </div>
      ))}

      {showPensionForm ? (
        <PensionForm
          me={me}
          onSubmit={(data) => { addPension(data); setShowPensionForm(false) }}
          onCancel={() => setShowPensionForm(false)}
        />
      ) : (
        <button style={btn('#555', '#f5f5f5', '0.5px solid #ddd')} onClick={() => setShowPensionForm(true)}>
          + 내가 찾은 펜션 공유하기
        </button>
      )}
    </div>
  )
}

const inp = { flex: 1, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', width: '100%' }
const cancelBtn = { flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', cursor: 'pointer' }
const submitBtn = { flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer' }
