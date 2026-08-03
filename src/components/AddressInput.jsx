import { useState, useRef, useEffect, useCallback } from 'react'

const KEY = import.meta.env.VITE_KAKAO_MAP_KEY

// autoload=false + kakao.maps.load() 방식 — 초기화 실패 시 onError 호출
function ensureSDK(onReady, onError) {
  if (window.kakao?.maps?.services) { onReady(); return }

  function tryLoad() {
    if (!window.kakao?.maps) {
      onError('no-kakao')
      return
    }
    window.kakao.maps.load(() => {
      if (window.kakao.maps.services) onReady()
      else onError('no-services')
    })
  }

  // 스크립트 태그가 이미 있으면 window.kakao 준비될 때까지 대기
  if (document.getElementById('kakao-map-sdk')) {
    if (window.kakao?.maps) { tryLoad(); return }
    const start = Date.now()
    const t = setInterval(() => {
      if (window.kakao?.maps) { clearInterval(t); tryLoad(); return }
      if (Date.now() - start > 7000) { clearInterval(t); onError('timeout') }
    }, 200)
    return
  }

  const s = document.createElement('script')
  s.id = 'kakao-map-sdk'
  s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&libraries=services&autoload=false`
  s.onload = tryLoad
  s.onerror = () => onError('load-failed')
  document.head.appendChild(s)
}

export default function AddressInput({ value, onChange, onSelect, placeholder, style = {} }) {
  const [query, setQuery] = useState(value ?? '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    ensureSDK(
      () => setSdkReady(true),
      (reason) => setSdkError(reason)
    )
  }, [])

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

  const baseStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box',
    background: '#fff', outline: 'none',
    ...style,
  }

  // API 키 없음
  if (!KEY) {
    return (
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
        placeholder="⚠️ VITE_KAKAO_MAP_KEY 미설정 — 직접 입력"
        style={{ ...baseStyle, borderColor: '#f0c5c5', color: '#A32D2D' }}
      />
    )
  }

  // SDK 로드 실패 → 수동 입력 허용
  if (sdkError) {
    return (
      <div>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
          placeholder={placeholder ?? '주소 직접 입력 (자동완성 불가)'}
          style={{ ...baseStyle, borderColor: '#e8c97a' }}
        />
        <div style={{ fontSize: 10, color: '#856404', marginTop: 3 }}>
          ⚠️ 지도 연결 실패 — 카카오 앱 도메인 등록 확인 필요
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={sdkReady ? (placeholder ?? '주소 또는 장소명 입력') : '지도 연결 중...'}
          disabled={!sdkReady}
          style={{ ...baseStyle, color: sdkReady ? '#222' : '#aaa' }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 11, color: '#aaa', pointerEvents: 'none',
          }}>검색 중...</span>
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
