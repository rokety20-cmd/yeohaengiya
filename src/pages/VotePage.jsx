import { useState } from 'react'
import { useVotes, usePensions } from '../hooks/useFirebase'
import { usePreferences } from '../hooks/usePreferences'
import { usePensionLikes } from '../hooks/usePensionLikes'
import { useConfirmedPension } from '../hooks/useConfirmedPension'
import { useConfirmedDate } from '../hooks/useFirebase'
import { useTripDateOptions, useTripMeta } from '../hooks/useTrips'
import { useFriends } from '../hooks/useFriends'

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']
function fmtKo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_KO[d.getDay()]})`
}

const CHOICE_COLOR = { prefer: '#1D9E75', ok: '#185FA5', no: '#A32D2D' }
const CHOICE_BG = { prefer: '#E1F5EE', ok: '#E6F1FB', no: '#FCEBEB' }
const CHOICE_LABEL = { prefer: '👍 선호', ok: '✅ 가능', no: '❌ 불가' }

function DateCard({ d, members, preferences, votes, myId, isTreasurer, confirmedDate, onCast, onConfirm }) {
  const datePrefs = preferences[d.id] || {}
  const prefer = members.filter((m) => datePrefs[m.id] === 'prefer')
  const ok = members.filter((m) => datePrefs[m.id] === 'ok')
  const no = members.filter((m) => datePrefs[m.id] === 'no')
  const score = prefer.length * 2 + ok.length

  // Legacy fallback: treat old 'prefer' vote as prefer if no new pref
  const myPref = datePrefs[myId] || (votes[myId] === d.id ? 'prefer' : null)
  const isConfirmed = confirmedDate === d.id

  return (
    <div style={{
      border: isConfirmed ? '2px solid #1D9E75' : myPref ? `2px solid ${CHOICE_COLOR[myPref] || '#185FA5'}` : '0.5px solid #e0e0e0',
      borderRadius: 12, padding: '12px 13px', marginBottom: 8,
      background: isConfirmed ? '#E1F5EE' : '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#FAEEDA', color: '#633806', fontWeight: 500 }}>
            {d.nights}박{d.nights + 1}일
          </span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{d.start} ~ {d.end}</span>
          {isConfirmed && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: '#E1F5EE', color: '#085041', fontWeight: 500 }}>확정!</span>}
          {score > 0 && !isConfirmed && (
            <span style={{ fontSize: 11, color: '#888' }}>⭐ {score}점</span>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
        👍선호 {prefer.length}명 · ✅가능 {ok.length}명 · ❌불가 {no.length}명
      </div>

      {/* Avatar row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {members.map((m) => {
          const c = datePrefs[m.id] || (votes[m.id] === d.id ? 'prefer' : null)
          return (
            <span key={m.id} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: c ? CHOICE_BG[c] : '#f5f5f5',
              color: c ? CHOICE_COLOR[c] : '#bbb',
              border: `0.5px solid ${c ? CHOICE_COLOR[c] + '55' : '#e0e0e0'}`,
            }}>
              {m.name}{c ? ' ' + (c === 'prefer' ? '👍' : c === 'ok' ? '✅' : '❌') : ''}
            </span>
          )
        })}
      </div>

      {/* My vote buttons */}
      {!isConfirmed && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {['prefer', 'ok', 'no'].map((choice) => (
            <button key={choice} onClick={() => onCast(myId, d.id, choice)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: myPref === choice ? 600 : 400,
              border: `1px solid ${CHOICE_COLOR[choice]}`,
              background: myPref === choice ? CHOICE_COLOR[choice] : '#fff',
              color: myPref === choice ? '#fff' : CHOICE_COLOR[choice],
              cursor: 'pointer',
            }}>{CHOICE_LABEL[choice]}</button>
          ))}
          {isTreasurer && !confirmedDate && (
            <button onClick={() => onConfirm(d.id)} style={{
              padding: '7px 10px', borderRadius: 8, fontSize: 12,
              border: '0.5px solid #1D9E75', background: '#fff', color: '#0F6E56', cursor: 'pointer',
            }}>📌 확정</button>
          )}
        </div>
      )}
    </div>
  )
}

function PensionCard({ p, myId, isTreasurer, likes, confirmedPension, onToggleLike, onConfirm, onRemove, memberCount }) {
  const likeMap = likes[p.key] || {}
  const likeCount = Object.keys(likeMap).length
  const iLiked = !!likeMap[myId]
  const isConfirmed = confirmedPension === p.key
  const perPerson = p.priceTotal && memberCount ? Math.round(p.priceTotal / memberCount) : null

  return (
    <div style={{
      border: isConfirmed ? '2px solid #1D9E75' : '0.5px solid #e0e0e0',
      borderRadius: 12, marginBottom: 8, background: '#fff', overflow: 'hidden',
    }}>
      {p.previewImage && (
        <img src={p.previewImage} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.target.style.display = 'none' }} />
      )}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {isConfirmed && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#E1F5EE', color: '#085041', fontWeight: 500 }}>확정!</span>}
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F1EFE8', color: '#444' }}>{p.who}</span>
          </div>
        </div>

        {/* 가격 정보 */}
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#555', marginBottom: 6, flexWrap: 'wrap' }}>
          {p.pricePerNight != null && <span>1박 {Number(p.pricePerNight).toLocaleString()}원</span>}
          {p.priceTotal != null && <span>총 {Number(p.priceTotal).toLocaleString()}원</span>}
          {perPerson != null && <span style={{ color: '#0C447C', fontWeight: 500 }}>1인 {perPerson.toLocaleString()}원</span>}
        </div>

        {/* 시설 정보 */}
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#888', marginBottom: 6, flexWrap: 'wrap' }}>
          {p.maxGuests && <span>최대 {p.maxGuests}인</span>}
          {p.bbq != null && <span>바베큐 {p.bbq ? '✓' : '✗'}</span>}
          {p.pool != null && <span>계곡/수영장 {p.pool ? '✓' : '✗'}</span>}
          {p.parking != null && <span>주차 {p.parking ? '✓' : '✗'}</span>}
        </div>

        {/* 체크인/아웃 */}
        {(p.checkin || p.checkout) && (
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            {p.checkin && `체크인 ${p.checkin}`}{p.checkout && ` · 체크아웃 ${p.checkout}`}
          </div>
        )}
        {p.cancelBefore && <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>취소 가능일: {p.cancelBefore}</div>}
        {p.desc && <div style={{ fontSize: 12, color: '#666', marginBottom: 6, lineHeight: 1.5 }}>{p.desc}</div>}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onToggleLike(p.key, myId)} style={{
            padding: '5px 10px', borderRadius: 8, fontSize: 12,
            border: `0.5px solid ${iLiked ? '#e05a7a' : '#e0e0e0'}`,
            background: iLiked ? '#FCEBEB' : '#f5f5f5',
            color: iLiked ? '#A32D2D' : '#888', cursor: 'pointer',
          }}>❤️ {likeCount}명</button>

          {p.url && p.url !== '#' && (
            <a href={p.url} target="_blank" rel="noreferrer" style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12, border: '0.5px solid #e0e0e0',
              background: '#f5f5f5', color: '#555', textDecoration: 'none',
            }}>예약 링크 →</a>
          )}

          {isTreasurer && !isConfirmed && (
            <button onClick={() => onConfirm(p.key)} style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12,
              border: '0.5px solid #1D9E75', background: '#E1F5EE', color: '#085041', cursor: 'pointer',
            }}>숙소 확정</button>
          )}
          {isTreasurer && isConfirmed && (
            <button onClick={() => onConfirm(null)} style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12,
              border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', cursor: 'pointer',
            }}>확정 취소</button>
          )}
          {p.who === myId && (
            <button onClick={() => onRemove(p.key)} style={{
              padding: '5px 8px', borderRadius: 8, fontSize: 12,
              border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer',
            }}>삭제</button>
          )}
        </div>
      </div>
    </div>
  )
}

function PensionForm({ me, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '', url: '', pricePerNight: '', priceTotal: '', maxGuests: '',
    bbq: false, pool: false, parking: false, checkin: '', checkout: '', cancelBefore: '', desc: '',
  })
  const [preview, setPreview] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  async function handlePreview() {
    if (!form.url.trim()) return
    setFetching(true); setFetchError(null)
    try {
      const res = await fetch(`/.netlify/functions/og-preview?url=${encodeURIComponent(form.url.trim())}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPreview(data)
      setForm((f) => ({ ...f, name: f.name || data.title || '', desc: f.desc || data.description || '' }))
    } catch {
      setFetchError('링크에서 정보를 가져오지 못했어요. 직접 입력해주세요.')
    } finally {
      setFetching(false)
    }
  }

  function handleSubmit() {
    if (!form.name.trim()) return alert('펜션 이름을 입력해주세요')
    onSubmit({
      ...form,
      pricePerNight: form.pricePerNight ? Number(form.pricePerNight) : null,
      priceTotal: form.priceTotal ? Number(form.priceTotal) : null,
      maxGuests: form.maxGuests ? Number(form.maxGuests) : null,
      previewImage: preview?.image || null,
      who: me.id,
    })
  }

  const set_ = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: 14, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input placeholder="🔗 예약 링크 붙여넣기" value={form.url} onChange={(e) => set_('url', e.target.value)} style={inp} />
        <button onClick={handlePreview} disabled={fetching || !form.url.trim()} style={{
          padding: '9px 12px', borderRadius: 8, border: 'none',
          background: fetching ? '#ccc' : '#185FA5', color: '#fff', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{fetching ? '조회 중...' : '자동 입력'}</button>
      </div>
      {fetchError && <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 8, background: '#FCEBEB', borderRadius: 6, padding: '6px 10px' }}>{fetchError}</div>}
      {preview?.image && (
        <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', maxHeight: 180 }}>
          <img src={preview.image} alt="" style={{ width: '100%', objectFit: 'cover', maxHeight: 180 }} onError={(e) => { e.target.style.display = 'none' }} />
        </div>
      )}
      <input placeholder="펜션 이름" value={form.name} onChange={(e) => set_('name', e.target.value)} style={{ ...inp, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input type="number" placeholder="1박 가격 (원)" value={form.pricePerNight} onChange={(e) => set_('pricePerNight', e.target.value)} style={{ ...inp, flex: 1 }} />
        <input type="number" placeholder="총 숙박비 (원)" value={form.priceTotal} onChange={(e) => set_('priceTotal', e.target.value)} style={{ ...inp, flex: 1 }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input type="number" placeholder="최대 인원" value={form.maxGuests} onChange={(e) => set_('maxGuests', e.target.value)} style={{ ...inp, flex: 1 }} />
        <input placeholder="체크인" value={form.checkin} onChange={(e) => set_('checkin', e.target.value)} style={{ ...inp, flex: 1 }} />
        <input placeholder="체크아웃" value={form.checkout} onChange={(e) => set_('checkout', e.target.value)} style={{ ...inp, flex: 1 }} />
      </div>
      <input placeholder="취소 가능일 (예: 7/15까지)" value={form.cancelBefore} onChange={(e) => set_('cancelBefore', e.target.value)} style={{ ...inp, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 13, color: '#555' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.bbq} onChange={(e) => set_('bbq', e.target.checked)} /> 바베큐
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.pool} onChange={(e) => set_('pool', e.target.checked)} /> 계곡/수영장
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.parking} onChange={(e) => set_('parking', e.target.checked)} /> 주차
        </label>
      </div>
      <textarea placeholder="특징 메모" value={form.desc} onChange={(e) => set_('desc', e.target.value)}
        style={{ ...inp, height: 60, resize: 'none', marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={cancelBtn}>취소</button>
        <button onClick={handleSubmit} style={submitBtn}>등록하기</button>
      </div>
    </div>
  )
}

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
    <div style={{ border: '0.5px dashed #ccc', borderRadius: 12, padding: 14, marginBottom: 8 }}>
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
            onChange={(e) => setEndDate(e.target.value)} style={{ ...inp, width: '100%' }} />
        </div>
      </div>
      {nights > 0 && (
        <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '7px 12px', marginBottom: 10, fontSize: 13, color: '#0C447C', fontWeight: 500 }}>
          📅 {fmtKo(startDate)} ~ {fmtKo(endDate)} · {nights}박 {nights + 1}일
        </div>
      )}
      <input placeholder="메모 (선택)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={cancelBtn}>취소</button>
        <button onClick={handleSubmit} style={submitBtn} disabled={nights <= 0}>추가</button>
      </div>
    </div>
  )
}

export default function VotePage({ me, tripId, tripMembers }) {
  const { votes } = useVotes(tripId)
  const { confirmedDate, confirm: confirmDate } = useConfirmedDate(tripId)
  const { pensions, addPension, removePension } = usePensions(tripId)
  const { options: dateOptions, addOption } = useTripDateOptions(tripId)
  const { friends } = useFriends()
  const { meta } = useTripMeta(tripId)
  const { preferences, castPreference } = usePreferences(tripId)
  const { pensionLikes, toggleLike } = usePensionLikes(tripId)
  const { confirmedPension, confirmPension } = useConfirmedPension(tripId)

  const [showDateForm, setShowDateForm] = useState(false)
  const [showPensionForm, setShowPensionForm] = useState(false)

  const memberMap = Object.fromEntries(friends.map((f) => [f.id, f]))
  const members = tripMembers.map((id) => memberMap[id]).filter(Boolean)
  const memberCount = members.length
  const isTreasurer = me.role === '총무'

  // Best date by score
  const bestDateId = dateOptions.reduce((best, d) => {
    const prefs = preferences[d.id] || {}
    const score = members.reduce((s, m) => s + (prefs[m.id] === 'prefer' ? 2 : prefs[m.id] === 'ok' ? 1 : 0), 0)
    const bestScore = best ? members.reduce((s, m) => {
      const p = (preferences[best] || {})[m.id]
      return s + (p === 'prefer' ? 2 : p === 'ok' ? 1 : 0)
    }, 0) : -1
    return score > bestScore ? d.id : best
  }, null)

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
      <button style={actionBtn} onClick={sendAlarm}>🔔 카카오톡으로 투표 요청 알림 보내기</button>

      {/* 날짜 투표 */}
      <div style={sectionLabel}>날짜 투표</div>
      {dateOptions.length === 0 && !showDateForm && (
        <div style={{ color: '#ccc', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>날짜 후보가 없어요. 아래 버튼으로 추가해주세요.</div>
      )}
      {dateOptions.map((d) => (
        <div key={d.id} style={{ position: 'relative' }}>
          {bestDateId === d.id && !confirmedDate && (
            <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, color: '#633806', background: '#FAEEDA', borderRadius: 20, padding: '1px 7px', zIndex: 1 }}>⭐ 최다 선호</div>
          )}
          <DateCard
            d={d}
            members={members}
            preferences={preferences}
            votes={votes}
            myId={me.id}
            isTreasurer={isTreasurer}
            confirmedDate={confirmedDate}
            onCast={castPreference}
            onConfirm={confirmDate}
          />
        </div>
      ))}

      {showDateForm ? (
        <DateOptionForm onAdd={(data) => { addOption(data); setShowDateForm(false) }} onCancel={() => setShowDateForm(false)} />
      ) : (
        <button style={ghostBtn} onClick={() => setShowDateForm(true)}>+ 날짜 후보 추가</button>
      )}

      {/* 참가자별 선택 현황 */}
      {members.length > 0 && dateOptions.length > 0 && (
        <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginTop: 4, marginBottom: 16 }}>
          <div style={sectionLabel}>참가자별 선택 현황</div>
          {members.map((m) => {
            const topChoice = dateOptions.reduce((best, d) => {
              const pref = (preferences[d.id] || {})[m.id]
              if (!pref) return best
              if (!best) return { d, pref }
              const rank = { prefer: 2, ok: 1, no: 0 }
              return rank[pref] > rank[best.pref] ? { d, pref } : best
            }, null)
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #eee' }}>
                <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 20, background: m.bg || '#eee', color: m.tc || '#333', flexShrink: 0, fontWeight: 500 }}>{m.name}</span>
                <span style={{ fontSize: 13, color: topChoice ? CHOICE_COLOR[topChoice.pref] : '#f09595', flex: 1 }}>
                  {topChoice ? `${topChoice.d.start} ${CHOICE_LABEL[topChoice.pref]}` : '미선택'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* 펜션 비교 */}
      <div style={{ margin: '8px 0' }}>
        <PensionSearch destination={meta?.destination} />
      </div>
      <div style={sectionLabel}>펜션 비교</div>

      {pensions.map((p) => (
        <PensionCard
          key={p.key}
          p={p}
          myId={me.id}
          isTreasurer={isTreasurer}
          likes={pensionLikes}
          confirmedPension={confirmedPension}
          onToggleLike={toggleLike}
          onConfirm={confirmPension}
          onRemove={removePension}
          memberCount={memberCount}
        />
      ))}

      {showPensionForm ? (
        <PensionForm
          me={me}
          onSubmit={(data) => { addPension(data); setShowPensionForm(false) }}
          onCancel={() => setShowPensionForm(false)}
        />
      ) : (
        <button style={ghostBtn} onClick={() => setShowPensionForm(true)}>+ 내가 찾은 펜션 공유하기</button>
      )}
    </div>
  )
}

const inp = { flex: 1, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', width: '100%' }
const cancelBtn = { flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#888', cursor: 'pointer' }
const submitBtn = { flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer' }
const actionBtn = { width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 500, border: '0.5px solid #85B7EB', background: '#E6F1FB', color: '#0C447C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }
const ghostBtn = { width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 500, border: '0.5px solid #ddd', background: '#f5f5f5', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }
const sectionLabel = { fontSize: 11, color: '#aaa', fontWeight: 500, margin: '14px 0 8px', letterSpacing: 0.4 }
