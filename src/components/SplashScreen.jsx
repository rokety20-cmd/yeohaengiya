import { useEffect, useState, useRef } from 'react'

const GIF_DURATION = 3000 // GIF 재생 시간 (ms) — GIF 길이에 맞게 조정

export default function SplashScreen({ onDone }) {
  const [fade, setFade] = useState(false)
  const t1Ref = useRef(null)
  const t2Ref = useRef(null)

  useEffect(() => {
    t1Ref.current = setTimeout(() => setFade(true), GIF_DURATION)
    t2Ref.current = setTimeout(onDone, GIF_DURATION + 400)
    return () => { clearTimeout(t1Ref.current); clearTimeout(t2Ref.current) }
  }, [onDone])

  function skip() {
    clearTimeout(t1Ref.current)
    clearTimeout(t2Ref.current)
    setFade(true)
    setTimeout(onDone, 400)
  }

  return (
    <div
      onClick={skip}
      style={{
        position: 'fixed',
        top: 0, bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: '#000',
        opacity: fade ? 0 : 1,
        transition: 'opacity 0.4s ease',
        zIndex: 9999,
        overflow: 'hidden',
        cursor: 'pointer',
      }}>
      <img
        src="/splash.gif"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 12, color: '#fff', letterSpacing: 1,
          background: 'rgba(0,0,0,0.45)', padding: '5px 16px',
          borderRadius: 20, backdropFilter: 'blur(4px)',
        }}>
          터치하여 스킵
        </span>
      </div>
    </div>
  )
}
