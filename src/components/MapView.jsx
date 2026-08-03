import { useEffect, useRef, useState, useCallback } from 'react'

const KEY = import.meta.env.VITE_KAKAO_MAP_KEY

const PT_CFG = {
  departure:   { bg: '#085041', fg: '#fff', label: '출발' },
  waypoint:    { bg: '#E07B00', fg: '#fff', label: '경유' },
  destination: { bg: '#0C447C', fg: '#fff', label: '도착' },
}

function pinHTML(label, bg) {
  return `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="background:${bg};color:#fff;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)">${label}</div>
    <div style="width:2px;height:6px;background:${bg}"></div>
    <div style="width:7px;height:7px;border-radius:50%;background:${bg}"></div>
  </div>`
}

function martHTML(name) {
  const short = name.length > 10 ? name.slice(0, 10) + '…' : name
  return `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="background:#A32D2D;color:#fff;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)">🛒 ${short}</div>
    <div style="width:2px;height:6px;background:#A32D2D"></div>
    <div style="width:7px;height:7px;border-radius:50%;background:#A32D2D"></div>
  </div>`
}

export default function MapView({ departure, waypoints, destination }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const [ready, setReady] = useState(false)
  const [martResults, setMartResults] = useState([])
  const [searching, setSearching] = useState(false)

  // SDK 로드 (한 번만)
  useEffect(() => {
    if (!KEY) return

    function waitReady() {
      const t = setInterval(() => {
        if (window.kakao?.maps?.services) { clearInterval(t); setReady(true) }
      }, 150)
    }

    if (window.kakao?.maps?.services) { setReady(true); return }
    if (document.getElementById('kakao-map-sdk')) { waitReady(); return }

    const s = document.createElement('script')
    s.id = 'kakao-map-sdk'
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&libraries=services`
    s.onload = waitReady
    s.onerror = () => console.warn('[MapView] Kakao SDK 로드 실패 — 도메인 등록 또는 API키 확인')
    document.head.appendChild(s)
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return
    mapRef.current = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(36.5, 127.5),
      level: 9,
    })
  }, [ready])

  // 오버레이 전체 제거
  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []
  }, [])

  // 경로 마커 & 폴리라인 업데이트
  useEffect(() => {
    if (!ready || !mapRef.current) return
    clearOverlays()
    setMartResults([])

    const ps = new window.kakao.maps.services.Places()
    const bounds = new window.kakao.maps.LatLngBounds()

    const points = [
      departure    ? { text: departure,    type: 'departure',    label: '출발' } : null,
      ...(waypoints || []).map((w, i) => ({ text: w, type: 'waypoint', label: `경유${i + 1}` })),
      destination  ? { text: destination,  type: 'destination',  label: '도착' } : null,
    ].filter(Boolean)

    if (points.length === 0) return

    const coordArr = new Array(points.length).fill(null)
    let completedCount = 0

    function onAllDone() {
      const valid = coordArr.filter(Boolean)
      if (valid.length < 2) return
      const poly = new window.kakao.maps.Polyline({
        path: valid,
        strokeWeight: 3,
        strokeColor: '#185FA5',
        strokeOpacity: 0.5,
        strokeStyle: 'shortdot',
      })
      poly.setMap(mapRef.current)
      overlaysRef.current.push(poly)
      if (!bounds.isEmpty()) mapRef.current.setBounds(bounds, 80)
    }

    points.forEach((pt, i) => {
      ps.keywordSearch(pt.text, (res, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const latlng = new window.kakao.maps.LatLng(Number(res[0].y), Number(res[0].x))
          coordArr[i] = latlng
          bounds.extend(latlng)

          const cfg = PT_CFG[pt.type]
          const ov = new window.kakao.maps.CustomOverlay({
            position: latlng,
            content: pinHTML(pt.label, cfg.bg),
            yAnchor: 1,
          })
          ov.setMap(mapRef.current)
          overlaysRef.current.push(ov)
        }
        completedCount++
        if (completedCount === points.length) onAllDone()
      }, { size: 1 })
    })
  }, [ready, departure, waypoints, destination, clearOverlays])

  // 마트 검색
  function handleMartSearch() {
    if (!ready || !mapRef.current) return
    setSearching(true)
    setMartResults([])

    // 기존 마트 마커 제거 (경로 마커는 유지)
    const toRemove = overlaysRef.current.filter(o => o._isMart)
    toRemove.forEach(o => o.setMap(null))
    overlaysRef.current = overlaysRef.current.filter(o => !o._isMart)

    const ps = new window.kakao.maps.services.Places()
    const center = mapRef.current.getCenter()
    const keywords = ['트레이더스', '이마트', '코스트코', '홈플러스']
    const collected = []
    let done = 0

    keywords.forEach(kw => {
      ps.keywordSearch(kw, (res, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          res.slice(0, 2).forEach(p => {
            const latlng = new window.kakao.maps.LatLng(Number(p.y), Number(p.x))
            const ov = new window.kakao.maps.CustomOverlay({
              position: latlng,
              content: martHTML(p.place_name),
              yAnchor: 1,
            })
            ov._isMart = true
            ov.setMap(mapRef.current)
            overlaysRef.current.push(ov)
            collected.push({
              name: p.place_name,
              address: p.road_address_name || p.address_name,
              distance: p.distance ? `${Math.round(p.distance / 1000)}km` : '',
            })
          })
        }
        done++
        if (done === keywords.length) {
          setMartResults(collected)
          setSearching(false)
        }
      }, {
        location: center,
        radius: 60000,
        sort: window.kakao.maps.services.SortBy.DISTANCE,
        size: 2,
      })
    })
  }

  if (!KEY) return null

  const hasRoute = departure || destination

  return (
    <div>
      {/* 지도 */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', background: '#e8e8e8', marginBottom: 8 }}
      />

      {/* 마트 검색 버튼 */}
      {hasRoute && (
        <button
          onClick={handleMartSearch}
          disabled={searching}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
            background: searching ? '#e0e0e0' : '#FCEBEB',
            color: searching ? '#aaa' : '#A32D2D',
            fontSize: 12, fontWeight: 500, cursor: searching ? 'default' : 'pointer',
            marginBottom: martResults.length > 0 ? 8 : 0,
          }}
        >
          {searching ? '검색 중...' : '🛒 경로 주변 대형마트 검색'}
        </button>
      )}

      {/* 마트 결과 목록 */}
      {martResults.length > 0 && (
        <div style={{ background: '#fff8f8', borderRadius: 10, padding: '8px 10px', border: '0.5px solid #f0c5c5' }}>
          <div style={{ fontSize: 11, color: '#A32D2D', fontWeight: 500, marginBottom: 6 }}>🛒 주변 대형마트</div>
          {martResults.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderTop: i > 0 ? '0.5px solid #f5e0e0' : 'none' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{m.address}</div>
              </div>
              {m.distance && <span style={{ fontSize: 11, color: '#A32D2D', flexShrink: 0, marginLeft: 8 }}>{m.distance}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
