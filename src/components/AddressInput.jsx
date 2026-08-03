import { useState, useRef, useEffect } from 'react'

const TYPE_TAG = {
  station:        { label: '역',     color: '#0C447C' },
  subway_entrance:{ label: '지하철', color: '#0C447C' },
  bus_stop:       { label: '버스',   color: '#633806' },
  restaurant:     { label: '음식점', color: '#A32D2D' },
  cafe:           { label: '카페',   color: '#633806' },
  hotel:          { label: '숙박',   color: '#4C0C7C' },
  motel:          { label: '숙박',   color: '#4C0C7C' },
  guest_house:    { label: '숙박',   color: '#4C0C7C' },
  hostel:         { label: '숙박',   color: '#4C0C7C' },
  park:           { label: '공원',   color: '#085041' },
  beach:          { label: '해변',   color: '#085041' },
  museum:         { label: '박물관', color: '#633806' },
  hospital:       { label: '병원',   color: '#A32D2D' },
  supermarket:    { label: '마트',   color: '#085041' },
  city:           { label: '도시',   color: '#555'    },
  town:           { label: '도시',   color: '#555'    },
  administrative: { label: '행정구역', color: '#555'  },
  county:         { label: '군/구',  color: '#555'    },
}

// Kakao REST API (서버 프록시) — 키 있을 때 우선 사용
async function searchKakao(q) {
  const res = await fetch(`/.netlify/functions/place-search?q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.documents || []).map(d => ({
    name: d.place_name,
    sub: d.road_address_name || d.address_name || '',
    tag: d.category_group_name ? { label: d.category_group_name, color: '#185FA5' } : null,
    lat: Number(d.y),
    lng: Number(d.x),
  }))
}

// Nominatim fallback — 키 없을 때
async function searchNominatim(q) {
  const params = new URLSearchParams({
    q, format: 'json', limit: 8,
    'accept-language': 'ko', countrycodes: 'kr', addressdetails: 1,
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!res.ok) return []
  return (await res.json()).map(formatNominatim)
}

function formatNominatim(item) {
  const a = item.address || {}
  const firstName = item.display_name.split(', ')[0]
  const name = a.station || a.amenity || a.tourism || a.leisure ||
    a.shop || a.building || a.historic || a.natural || firstName
  const location = [
    a.suburb || a.quarter || a.city_district,
    a.city || a.town || a.village || a.county,
    a.state,
  ].filter(Boolean).filter(p => p !== name).slice(0, 2).join(' ')
  const tag = TYPE_TAG[item.type] || TYPE_TAG[item.class] || null
  return { name, sub: location, tag, lat: Number(item.lat), lng: Number(item.lon) }
}

async function searchPlace(q) {
  const kakao = await searchKakao(q)
  if (kakao.length > 0) return kakao
  return searchNominatim(q)
}

function dedup(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.name + '|' + Math.round(item.lat * 50) + '|' + Math.round(item.lng * 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function AddressInput({ value, onChange, onSelect, placeholder, style = {} }) {
  const [query, setQuery] = useState(value ?? '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => { setQuery(value ?? '') }, [value])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    onChange(q)
    clearTimeout(timer.current)
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchPlace(q)
        const formatted = dedup(data.map(formatItem))
        setResults(formatted)
        setOpen(formatted.length > 0)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 500)
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
    background: '#fff', outline: 'none', ...style,
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? '주소 또는 장소명 입력'}
          style={baseStyle}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {r.tag && (
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 8, flexShrink: 0,
                    background: r.tag.color + '18', color: r.tag.color, fontWeight: 600,
                  }}>{r.tag.label}</span>
                )}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{r.name}</span>
              </div>
              {r.sub && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 2, paddingLeft: r.tag ? 2 : 0 }}>
                  {r.sub}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
