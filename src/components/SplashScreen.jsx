import { useEffect, useState } from 'react'

const GIF_DURATION = 3000 // GIF 재생 시간 (ms) — GIF 길이에 맞게 조정

export default function SplashScreen({ onDone }) {
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { onDone(); return }

    const t1 = setTimeout(() => setFade(true), GIF_DURATION)
    const t2 = setTimeout(onDone, GIF_DURATION + 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      opacity: fade ? 0 : 1,
      transition: 'opacity 0.4s ease',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img
        src="/splash.gif"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}
