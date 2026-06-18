import { useEffect, useState } from 'react'

const IMAGES = ['/splash.jpg', '/splash2.png', '/splash3.png']
const DURATION = 600 // 장당 0.6초

export default function SplashScreen({ onDone }) {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { onDone(); return }

    if (index < IMAGES.length - 1) {
      // 다음 이미지로
      const t = setTimeout(() => setIndex((i) => i + 1), DURATION)
      return () => clearTimeout(t)
    } else {
      // 마지막 이미지 → 페이드아웃 후 완료
      const t1 = setTimeout(() => setFade(true), DURATION)
      const t2 = setTimeout(onDone, DURATION + 400)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [index, onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      opacity: fade ? 0 : 1,
      transition: 'opacity 0.4s ease',
      zIndex: 9999,
    }}>
      {IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt="splash"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: index === i ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        />
      ))}
    </div>
  )
}
