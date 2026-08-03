import { useState, useRef, useEffect } from 'react'

async function searchPlace(q) {
  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: 6,
    'accept-language': 'ko',
    countrycodes: 'kr',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!res.ok) return []
  return res.json()
}

function formatItem(item) {
  const parts = item.display_name.split(', ')
  const name = parts[0]
  const sub = parts.slice(1).filter(p => p !== '대한민국').slice(0, 3).join(', ')
  return { name, sub, lat: Number(item.lat), lng: Number(item.lon) }
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
        const formatted = data.map(formatItem)
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
              <div style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{r.name}</div>
              {r.sub && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{r.sub}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
