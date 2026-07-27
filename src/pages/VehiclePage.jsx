import { useState, useCallback } from 'react'
import { useVehicles } from '../hooks/useVehicles'
import { useFriends } from '../hooks/useFriends'
import MapView from '../components/MapView'

function fmtAmt(n) {
  const v = Math.round(Number(n) || 0)
  if (v === 0) return '0원'
  const man = Math.floor(v / 10000)
  const rest = v % 10000
  if (man > 0 && rest === 0) return `${man.toLocaleString()}만원`
  if (man > 0) return `${man.toLocaleString()}만 ${rest.toLocaleString()}원`
  return `${rest.toLocaleString()}원`
}

function calcCost(v) {
  const dist = Number(v.distanceKm || 0)
  const actual = v.isRoundTrip ? dist * 2 : dist
  const pax = (v.passengerIds || []).length
  if (actual === 0 || pax === 0) return null
  let total = 0
  if (v.costMethod === 'perKm') {
    total = Math.round(actual * Number(v.perKmRate || 200))
  } else {
    total = Math.round((actual / Number(v.fuelEfficiency || 12)) * Number(v.gasPrice || 1700))
  }
  return { total, perPerson: Math.round(total / pax), actual }
}

const DEFAULTS = {
  name: '', capacity: '', passengerIds: [],
  departure: '', destination: '', waypoints: [],
  distanceKm: '', isRoundTrip: true,
  costMethod: 'fuel', fuelEfficiency: 12, gasPrice: 1700, perKmRate: 200,
  departureTime: '',
}

// ─── 폼 ───────────────────────────────────────────────────────────────────────
function VehicleForm({ initial, members, onSave, onCancel }) {
  const [d, setD] = useState({ ...DEFAULTS, ...initial, passengerIds: initial?.passengerIds ?? [] })
  const [wpInput, setWpInput] = useState('')
  const [gasFetching, setGasFetching] = useState(false)
  const [gasInfo, setGasInfo] = useState(null) // { price, date, fallback }

  const fetchGasPrice = useCallback(async () => {
    setGasFetching(true)
    try {
      const res = await fetch('/.netlify/functions/gas-price')
      const data = await res.json()
      set('gasPrice', data.gasoline.price)
      setGasInfo({ price: data.gasoline.price, date: data.gasoline.date, fallback: data.fallback })
    } catch {
      setGasInfo({ error: true })
    } finally {
      setGasFetching(false)
    }
  }, [])

  function set(k, v) { setD(p => ({ ...p, [k]: v })) }
  function togglePax(id) {
    setD(p => ({
      ...p,
      passengerIds: p.passengerIds.includes(id)
        ? p.passengerIds.filter(x => x !== id)
        : [...p.passengerIds, id],
    }))
  }
  function addWp() {
    const t = wpInput.trim(); if (!t) return
    setD(p => ({ ...p, waypoints: [...(p.waypoints || []), t] }))
    setWpInput('')
  }
  function removeWp(i) { setD(p => ({ ...p, waypoints: p.waypoints.filter((_, idx) => idx !== i) })) }

  function handleSave() {
    if (!d.name.trim()) return alert('차량 이름을 입력해주세요')
    onSave({
      ...d, name: d.name.trim(),
      capacity: d.capacity ? Number(d.capacity) : null,
      distanceKm: d.distanceKm ? Number(d.distanceKm) : 0,
      fuelEfficiency: Number(d.fuelEfficiency || 12),
      gasPrice: Number(d.gasPrice || 1700),
      perKmRate: Number(d.perKmRate || 200),
    })
  }

  const pax = d.passengerIds.length
  const cap = d.capacity ? Number(d.capacity) : null
  const over = cap && pax > cap

  return (
    <div style={{ background: '#f5f5f5', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
      {/* 차량 기본 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 2 }}>
          <div style={lbl}>차량 이름</div>
          <input value={d.name} onChange={e => set('name', e.target.value)} placeholder="예: 1호차 / 병수차" style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={lbl}>정원 (선택)</div>
          <input type="number" value={d.capacity} onChange={e => set('capacity', e.target.value)} placeholder="5" style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={lbl}>출발 시각</div>
          <input type="time" value={d.departureTime} onChange={e => set('departureTime', e.target.value)} style={inp} />
        </div>
      </div>

      {/* 탑승자 */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...lbl, marginBottom: 6 }}>
          탑승자
          {pax > 0 && (
            <span style={{ marginLeft: 6, color: over ? '#A32D2D' : '#1D9E75' }}>
              {pax}명{cap ? `/${cap}명` : ''}{over ? ' ⚠️ 정원 초과' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {members.map(m => (
            <button key={m.id} onClick={() => togglePax(m.id)} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `0.5px solid ${d.passengerIds.includes(m.id) ? '#185FA5' : '#e0e0e0'}`,
              background: d.passengerIds.includes(m.id) ? '#E6F1FB' : '#fff',
              color: d.passengerIds.includes(m.id) ? '#0C447C' : '#888',
            }}>{m.name}</button>
          ))}
        </div>
      </div>

      {/* 경로 */}
      <div style={{ marginBottom: 10 }}>
        <div style={lbl}>출발지</div>
        <input value={d.departure} onChange={e => set('departure', e.target.value)} placeholder="예: 서울 강남구" style={{ ...inp, marginBottom: 6 }} />

        {(d.waypoints || []).map((wp, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#aaa', minWidth: 32 }}>경유{i + 1}</span>
            <div style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: '#e8e8e8', fontSize: 13, color: '#555' }}>{wp}</div>
            <button onClick={() => removeWp(i)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#f0c5c5', color: '#A32D2D', cursor: 'pointer' }}>✕</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={wpInput} onChange={e => setWpInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWp()}
            placeholder="경유지 추가 (Enter)" style={{ ...inp, flex: 1 }} />
          <button onClick={addWp} style={{ padding: '7px 12px', borderRadius: 8, border: '0.5px solid #ccc', background: '#fff', fontSize: 12, cursor: 'pointer' }}>+ 추가</button>
        </div>

        <div style={lbl}>목적지</div>
        <input value={d.destination} onChange={e => set('destination', e.target.value)} placeholder="예: 강원도 인제군" style={inp} />
      </div>

      {/* 거리 + 왕복 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={lbl}>편도 거리 (km)</div>
          <input type="number" value={d.distanceKm} onChange={e => set('distanceKm', e.target.value)} placeholder="150" style={inp} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', paddingBottom: 10, cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={d.isRoundTrip} onChange={e => set('isRoundTrip', e.target.checked)} />
          왕복
        </label>
      </div>

      {/* 비용 방식 */}
      <div style={{ background: '#E6F1FB', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {[['fuel', '⛽ 유류비 방식'], ['perKm', '📏 거리당 정액']].map(([val, txt]) => (
            <button key={val} onClick={() => set('costMethod', val)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer',
              background: d.costMethod === val ? '#185FA5' : '#d0e4f7',
              color: d.costMethod === val ? '#fff' : '#555',
              fontWeight: d.costMethod === val ? 600 : 400,
            }}>{txt}</button>
          ))}
        </div>
        {d.costMethod === 'fuel' ? (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={lbl}>연비 (km/L)</div>
                <input type="number" value={d.fuelEfficiency} onChange={e => set('fuelEfficiency', e.target.value)} style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={lbl}>유가 (원/L)</div>
                <input type="number" value={d.gasPrice} onChange={e => { set('gasPrice', e.target.value); setGasInfo(null) }} style={inp} />
              </div>
            </div>
            {/* 유가 자동 조회 버튼 */}
            <button
              onClick={fetchGasPrice}
              disabled={gasFetching}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 8, border: 'none',
                background: gasFetching ? '#d0e4f7' : '#185FA5',
                color: '#fff', fontSize: 12, fontWeight: 500, cursor: gasFetching ? 'default' : 'pointer',
              }}
            >
              {gasFetching ? '조회 중...' : '📡 오늘 전국 평균 유가 자동 입력'}
            </button>
            {gasInfo && !gasInfo.error && (
              <div style={{ marginTop: 5, fontSize: 11, color: gasInfo.fallback ? '#888' : '#1D9E75', textAlign: 'center' }}>
                {gasInfo.fallback
                  ? `⚠️ 오피넷 조회 실패 — 최근 평균값 ${gasInfo.price.toLocaleString()}원 사용`
                  : `✅ ${gasInfo.date} 오피넷 전국평균 휘발유 ${gasInfo.price.toLocaleString()}원/L`}
              </div>
            )}
            {gasInfo?.error && (
              <div style={{ marginTop: 5, fontSize: 11, color: '#A32D2D', textAlign: 'center' }}>
                조회 실패 — 수동으로 입력해주세요
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={lbl}>단가 (원/km)</div>
            <input type="number" value={d.perKmRate} onChange={e => set('perKmRate', e.target.value)} style={inp} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onCancel} style={cancelBtn}>취소</button>
        <button onClick={handleSave} style={saveBtn}>저장</button>
      </div>
    </div>
  )
}

// ─── 카드 ──────────────────────────────────────────────────────────────────────
function VehicleCard({ vehicle: v, memberMap, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const passengers = (v.passengerIds || []).map(id => memberMap[id]).filter(Boolean)
  const cap = v.capacity ? Number(v.capacity) : null
  const over = cap && passengers.length > cap
  const cost = calcCost(v)
  const routeParts = [v.departure, ...(v.waypoints || []), v.destination].filter(Boolean)

  function openMap() {
    const q = encodeURIComponent(routeParts.join(' → '))
    window.open(`https://map.kakao.com/?q=${q}`, '_blank')
  }
  function openMart() {
    const near = v.waypoints?.length ? v.waypoints[v.waypoints.length - 1] : (v.destination || v.departure)
    window.open(`https://map.kakao.com/?q=${encodeURIComponent('대형마트 트레이더스 이마트 코스트코 ' + near)}`, '_blank')
  }

  return (
    <div style={{ borderRadius: 14, border: '0.5px solid #e0e0e0', background: '#fff', marginBottom: 10, overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>🚗 {v.name}</span>
          {v.departureTime && (
            <span style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 8px', borderRadius: 12, color: '#555' }}>🕐 {v.departureTime}</span>
          )}
          {over && (
            <span style={{ fontSize: 11, background: '#FCEBEB', color: '#A32D2D', padding: '2px 8px', borderRadius: 12 }}>⚠️ 정원 초과</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#ccc' }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {/* 탑승자 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: routeParts.length > 0 ? 8 : 0 }}>
          {passengers.length > 0 ? passengers.map(m => (
            <span key={m.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: m.bg || '#eee', color: m.tc || '#333' }}>
              {m.name}
            </span>
          )) : <span style={{ fontSize: 12, color: '#bbb' }}>탑승자 없음</span>}
          {cap && <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center' }}>({passengers.length}/{cap}명)</span>}
        </div>

        {/* 경로 요약 */}
        {routeParts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3, marginBottom: cost ? 6 : 0 }}>
            {routeParts.map((part, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {i > 0 && <span style={{ fontSize: 11, color: '#ccc' }}>→</span>}
                <span style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 10,
                  background: i === 0 ? '#E1F5EE' : i === routeParts.length - 1 ? '#E6F1FB' : '#f5f5f5',
                  color: i === 0 ? '#085041' : i === routeParts.length - 1 ? '#0C447C' : '#888',
                }}>{part}</span>
              </span>
            ))}
            {v.isRoundTrip && <span style={{ fontSize: 11, color: '#aaa' }}>왕복</span>}
          </div>
        )}

        {/* 비용 요약 */}
        {cost && (
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
            총 <strong>{fmtAmt(cost.total)}</strong>
            <span style={{ color: '#185FA5', fontWeight: 600, marginLeft: 8 }}>1인 {fmtAmt(cost.perPerson)}</span>
            <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>({cost.actual}km 기준)</span>
          </div>
        )}
      </div>

      {/* 상세 펼침 */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '12px 14px', background: '#fafafa' }}>
          {/* 비용 계산 상세 */}
          {cost ? (
            <div style={{ background: '#E6F1FB', borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 500, color: '#0C447C', marginBottom: 4 }}>
                {v.costMethod === 'fuel'
                  ? `⛽ 유류비: ${v.distanceKm}km${v.isRoundTrip ? ` × 2 = ${Number(v.distanceKm) * 2}km` : ''} ÷ ${v.fuelEfficiency}km/L × ${Number(v.gasPrice).toLocaleString()}원`
                  : `📏 거리 × 단가: ${cost.actual}km × ${Number(v.perKmRate).toLocaleString()}원`}
              </div>
              <div style={{ color: '#333' }}>
                차량 총 비용 <strong>{fmtAmt(cost.total)}</strong> ({cost.total.toLocaleString()}원)
                ÷ {passengers.length}명 = <strong style={{ color: '#185FA5' }}>{fmtAmt(cost.perPerson)}</strong>
              </div>
              {passengers.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {passengers.map(m => (
                    <span key={m.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: m.bg || '#eee', color: m.tc || '#333' }}>
                      {m.name} {fmtAmt(cost.perPerson)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
              편도 거리와 탑승자를 입력하면 비용이 계산됩니다
            </div>
          )}

          {/* 카카오 지도 */}
          {(v.departure || v.destination) && (
            <div style={{ marginBottom: 10 }}>
              <MapView
                departure={v.departure}
                waypoints={v.waypoints || []}
                destination={v.destination}
              />
            </div>
          )}

          {/* 카카오맵 앱 열기 */}
          {routeParts.length > 0 && (
            <button onClick={openMap} style={{ ...extBtn, width: '100%', marginBottom: 8 }}>🗺️ 카카오맵에서 경로 보기</button>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onEdit} style={{ ...cancelBtn, fontSize: 12 }}>✏️ 수정</button>
            <button onClick={onDelete} style={{ ...cancelBtn, fontSize: 12, color: '#A32D2D', borderColor: '#f09595' }}>🗑️ 삭제</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────
export default function VehiclePage({ tripId, tripMembers }) {
  const memberIds = tripMembers || []
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle } = useVehicles(tripId)
  const { friends } = useFriends()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const memberMap = Object.fromEntries(friends.map(f => [f.id, f]))
  const members = memberIds.map(id => memberMap[id]).filter(Boolean)

  // 전체 탑승자 비용 합산 (참가자별)
  const perPersonCosts = {}
  vehicles.forEach(v => {
    const cost = calcCost(v)
    if (!cost) return
    ;(v.passengerIds || []).forEach(id => {
      perPersonCosts[id] = (perPersonCosts[id] || 0) + cost.perPerson
    })
  })
  const hasCosts = Object.keys(perPersonCosts).length > 0

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  return (
    <div style={{ padding: '12px 16px 40px' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
        🚗 차량별 탑승자·경로·비용을 관리하세요
      </div>

      {/* 차량 목록 */}
      {vehicles.map(v => {
        if (editingId === v.id) {
          return (
            <VehicleForm
              key={v.id}
              initial={v}
              members={members}
              onSave={fields => { updateVehicle(v.id, fields); setEditingId(null) }}
              onCancel={() => setEditingId(null)}
            />
          )
        }
        return (
          <VehicleCard
            key={v.id}
            vehicle={v}
            memberMap={memberMap}
            onEdit={() => { setEditingId(v.id); setShowForm(false) }}
            onDelete={() => { if (confirm(`"${v.name}"을 삭제할까요?`)) deleteVehicle(v.id) }}
          />
        )
      })}

      {/* 추가 폼 */}
      {showForm ? (
        <VehicleForm
          members={members}
          onSave={fields => { addVehicle(fields); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button onClick={() => { setShowForm(true); setEditingId(null) }} style={{
          width: '100%', padding: '10px 0', borderRadius: 10, border: '0.5px dashed #ccc',
          background: '#fafafa', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 16,
        }}>🚗 차량 추가</button>
      )}

      {/* 참가자별 차량비 합산 */}
      {hasCosts && (
        <div style={{ background: '#E1F5EE', borderRadius: 14, padding: '14px 16px', marginTop: 4 }}>
          <div style={{ fontSize: 11, color: '#085041', fontWeight: 500, marginBottom: 10, letterSpacing: 0.4 }}>
            🧾 참가자별 차량비 합산
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {memberIds.map(id => {
              const m = memberMap[id]
              const amt = perPersonCosts[id]
              if (!m) return null
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 10, padding: '7px 12px', border: '0.5px solid #c8e8d8' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: m.bg || '#eee', color: m.tc || '#333' }}>{m.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: amt ? '#085041' : '#aaa' }}>
                    {amt ? fmtAmt(amt) : '미배정'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const inp = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', background: '#fff' }
const lbl = { fontSize: 11, color: '#aaa', marginBottom: 4, fontWeight: 500 }
const cancelBtn = { flex: 1, padding: '8px 0', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }
const saveBtn = { flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const extBtn = { flex: 1, padding: '7px 0', borderRadius: 8, border: '0.5px solid #e0e0e0', background: '#fff', fontSize: 12, color: '#555', cursor: 'pointer' }
