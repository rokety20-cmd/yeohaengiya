import { useState, useRef, useEffect, useCallback } from 'react'

const KEY = import.meta.env.VITE_KAKAO_MAP_KEY

function ensureSDK(cb) {
  if (window.kakao?.maps?.services) { cb(); return }

  function waitReady() {
    const t = setInterval(() => {
      if (window.kakao?.maps?.services) { clearInterval(t); cb() }
    }, 150)
  }

  if (document.getElementById('kakao-map-sdk')) { waitReady(); return }

  const s = document.createElement('script')
  s.id = 'kakao-map-sdk'
  s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&libraries=services`
  s.onload = waitReady
  s.onerror = () => console.warn('[AddressInput] Kakao SDK 로드 실패 — 도메인 등록 또는 API키 확인')
  document.head.appendChild(s)
}

// onSelect(text, lat, lng) — 드롭다운에서 선택 시 좌표도 함께 전달
export default function AddressInput({ value, onChange, onSelect, placeholder, style = {} }) {
  const [query, setQuery] = useState(value ?? '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => { ensureSDK(() => setSdkReady(true)) }, [])

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => { setQuery(value ?? '') }, [value])

  const search = useCallback((q) => {
    if (!sdkReady || !q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)

    const collected = []
    let pending = 2

    function finish() {
      pending--
      if (pending > 0) return
      setLoading(false)
      const seen = new Set()
      const unique = collected.filter(r => {
        const key = (r.address || r.name) + r.name
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      setResults(unique.slice(0, 7))
      setOpen(unique.length > 0)
    }

    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.addressSearch(q, (res, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        res.slice(0, 3).forEach(r => collected.push({
          name: r.address_name,
          sub: r.road_address?.address_name || '',
          tag: '주소', tagColor: '#0C447C',
          lat: Number(r.y), lng: Number(r.x),
        }))
      }
      finish()
    })

    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(q, (res, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        res.slice(0, 5).forEach(r => collected.push({
          name: r.place_name,
          address: r.road_address_name || r.address_name,
          sub: r.road_address_name || r.address_name,
          tag: r.category_group_name || '장소', tagColor: '#633806',
          lat: Number(r.y), lng: Number(r.x),
        }))
      }
      finish()
    }, { size: 5 })
  }, [sdkReady])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    onChange(q)
    clearTimeout(timer.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(() => search(q), 280)
  }

  function handleSelect(item) {
    setQuery(item.name)
    onChange(item.name)
    if (onSelect) onSelect(item.name, item.lat, item.lng)
    setResults([])
    setOpen(false)
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box',
    background: '#fff', outline: 'none',
    ...style,
  }

  // API 키가 빌드에 포함되지 않은 경우 → 눈에 보이는 오류 표시
  if (!KEY) {
    return (
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
        placeholder="⚠️ VITE_KAKAO_MAP_KEY 미설정 — 직접 입력"
        style={{ ...inputStyle, borderColor: '#f0c5c5', color: '#A32D2D' }}
      />
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? '주소 또는 장소명 입력'}
          style={inputStyle}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 11, color: '#aaa', pointerEvents: 'none',
          }}>검색 중...</span>
        )}
        {!sdkReady && !loading && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 10, color: '#ccc', pointerEvents: 'none',
          }}>로딩 중</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', borderRadius: 10, border: '0.5px solid #e0e0e0',
          boxShadow: '0 6px 20px rgba(0,0,0,.12)', overflow: 'hidden',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '9px 12px', border: 'none', background: 'transparent',
                borderTop: i > 0 ? '0.5px solid #f5f5f5' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: r.sub ? 2 : 0 }}>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 8,
                  background: r.tagColor + '18', color: r.tagColor, flexShrink: 0,
                }}>{r.tag}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{r.name}</span>
              </div>
              {r.sub && r.sub !== r.name && (
                <div style={{ fontSize: 11, color: '#999', paddingLeft: 2 }}>{r.sub}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
