import { useEffect, useState } from 'react'

// 최소 600ms 브랜딩 노출, 데이터 준비되면 즉시 해제
export default function SplashScreen({ onDone, dataReady }) {
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // reduced motion: 즉시 완료
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { onDone(); return }

    // Firebase 응답 없을 때를 대비한 최대 대기 2초
    const maxTimer = setTimeout(() => {
      setFade(true)
      setTimeout(onDone, 400)
    }, 2000)

    if (minTimePassed && dataReady) {
      clearTimeout(maxTimer)
      setFade(true)
      const t = setTimeout(onDone, 400)
      return () => { clearTimeout(t); clearTimeout(maxTimer) }
    }
    return () => clearTimeout(maxTimer)
  }, [minTimePassed, dataReady, onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fade ? 0 : 1,
      transition: 'opacity 0.4s ease',
      zIndex: 9999,
    }}>
      <img
        src="/splash.jpg"
        alt="splash"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}
