import { useState } from 'react'
import { useVehicles } from '../hooks/useVehicles'
import { useFriends } from '../hooks/useFriends'
import MapView from '../components/MapView'
import AddressInput from '../components/AddressInput'

const DEFAULTS = {
  name: '', capacity: '', passengerIds: [],
  departure: '', destination: '', waypoints: [],
  distanceKm: '', isRoundTrip: true,
  departureTime: '',
}

// 직선거리 (하버사인 공식) — 실제 도로거리는 약 1.2~1.4배
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)))
}

// ─── 폼 ───────────────────────────────────────────────────────────────────────
function VehicleForm({ initial, members, onSave, onCancel }) {
  const [d, setD] = useState({ ...DEFAULTS, ...initial, passengerIds: initial?.passengerIds ?? [] })
  const [wpInput, setWpInput] = useState('')
  const [depCoords, setDepCoords] = useState(null)   // { lat, lng }
  const [destCoords, setDestCoords] = useState(null)
  const [autoCalc, setAutoCalc] = useState(false)

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
      ...d,
      name: d.name.trim(),
      capacity: d.capacity ? Number(d.capacity) : null,
      distanceKm: d.distanceKm ? Number(d.distanceKm) : 0,
    })
  }

  const pax = d.passengerIds.length
  const cap = d.capacity ? Number(d.capacity) : null
  const over = cap && pax > cap

  const dist = Number(d.distanceKm || 0)
  const totalDist = d.isRoundTrip ? dist * 2 : dist

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
        <div style={{ marginBottom: 6 }}>
          <AddressInput
            value={d.departure}
            onChange={v => { set('departure', v); setDepCoords(null); setAutoCalc(false) }}
            onSelect={(_, lat, lng) => {
              setDepCoords({ lat, lng })
              if (destCoords) {
                set('distanceKm', haversineKm(lat, lng, destCoords.lat, destCoords.lng))
                setAutoCalc(true)
              }
            }}
            placeholder="예: 서울 강남구, 호수로 336"
          />
        </div>

        {(d.waypoints || []).map((wp, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#aaa', minWidth: 32 }}>경유{i + 1}</span>
            <div style={{ flex: 1 }}>
              <AddressInput
                value={wp}
                onChange={v => setD(p => ({ ...p, waypoints: p.waypoints.map((w, j) => j === i ? v : w) }))}
                placeholder="경유지 주소"
              />
            </div>
            <button onClick={() => removeWp(i)} style={{ fontSize: 11, padding: '8px 10px', borderRadius: 6, border: 'none', background: '#f0c5c5', color: '#A32D2D', cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <AddressInput
              value={wpInput}
              onChange={setWpInput}
              placeholder="경유지 추가"
            />
          </div>
          <button onClick={addWp} style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid #ccc', background: '#fff', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>+ 추가</button>
        </div>

        <div style={lbl}>목적지</div>
        <AddressInput
          value={d.destination}
          onChange={v => { set('destination', v); setDestCoords(null); setAutoCalc(false) }}
          onSelect={(_, lat, lng) => {
            setDestCoords({ lat, lng })
            if (depCoords) {
              set('distanceKm', haversineKm(depCoords.lat, depCoords.lng, lat, lng))
              setAutoCalc(true)
            }
          }}
          placeholder="예: 강원도 인제 채움펜션"
        />
      </div>

      {/* 거리 + 왕복 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6 }}>
            편도 거리 (km)
            {autoCalc && (
              <span style={{ fontSize: 10, background: '#E1F5EE', color: '#085041', padding: '1px 7px', borderRadius: 8 }}>
                ✓ 자동계산
              </span>
            )}
          </div>
          <input
            type="number"
            value={d.distanceKm}
            onChange={e => { set('distanceKm', e.target.value); setAutoCalc(false) }}
            placeholder="출발지·목적지 선택 시 자동계산"
            style={inp}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', paddingBottom: 10, cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={d.isRoundTrip} onChange={e => set('isRoundTrip', e.target.checked)} />
          왕복
        </label>
      </div>
      {dist > 0 && (
        <div style={{ fontSize: 12, color: '#185FA5', marginBottom: 10, paddingLeft: 2 }}>
          📍 총 거리: <strong>{totalDist}km</strong>
          {d.isRoundTrip && <span style={{ color: '#aaa', marginLeft: 6 }}>({dist}km × 2)</span>}
          {autoCalc && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 8 }}>직선거리 기준 (실제 도로는 약 1.2배)</span>}
        </div>
      )}

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
  const routeParts = [v.departure, ...(v.waypoints || []), v.destination].filter(Boolean)
  const dist = Number(v.distanceKm || 0)
  const totalDist = dist > 0 ? (v.isRoundTrip ? dist * 2 : dist) : null

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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3, marginBottom: totalDist ? 6 : 0 }}>
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

        {/* 거리 요약 */}
        {totalDist && (
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
            📍 총 거리: <strong>{totalDist}km</strong>
            {v.isRoundTrip && dist > 0 && <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>({dist}km × 2)</span>}
          </div>
        )}
      </div>

      {/* 상세 펼침 */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '12px 14px', background: '#fafafa' }}>
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

          {routeParts.length > 0 && (
            <button onClick={() => {
              const q = encodeURIComponent(routeParts.join(' → '))
              window.open(`https://map.kakao.com/?q=${q}`, '_blank')
            }} style={{ ...extBtn, width: '100%', marginBottom: 8 }}>🗺️ 카카오맵에서 경로 보기</button>
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

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  return (
    <div style={{ padding: '12px 16px 40px' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
        🚗 차량별 탑승자·경로·거리를 관리하세요
      </div>

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

      {showForm ? (
        <VehicleForm
          members={members}
          onSave={fields => { addVehicle(fields); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button onClick={() => { setShowForm(true); setEditingId(null) }} style={{
          width: '100%', padding: '10px 0', borderRadius: 10, border: '0.5px dashed #ccc',
          background: '#fafafa', color: '#888', fontSize: 13, cursor: 'pointer',
        }}>🚗 차량 추가</button>
      )}
    </div>
  )
}

const inp = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', background: '#fff' }
const lbl = { fontSize: 11, color: '#aaa', marginBottom: 4, fontWeight: 500 }
const cancelBtn = { flex: 1, padding: '8px 0', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }
const saveBtn = { flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const extBtn = { flex: 1, padding: '7px 0', borderRadius: 8, border: '0.5px solid #e0e0e0', background: '#fff', fontSize: 12, color: '#555', cursor: 'pointer' }
