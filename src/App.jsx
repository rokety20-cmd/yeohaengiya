import { useState, useCallback } from 'react'
import SplashScreen from './components/SplashScreen'
import MemberSelect from './components/MemberSelect'
import ConfirmedBanner from './components/ConfirmedBanner'
import StepBar from './components/StepBar'
import VotePage from './pages/VotePage'
import PrepPage from './pages/PrepPage'
import CostPage from './pages/CostPage'
import { useConfirmedDate } from './hooks/useFirebase'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [me, setMe] = useState(null)
  const [step, setStep] = useState('vote')
  const { confirmedDate } = useConfirmedDate()
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  if (!splashDone) return <SplashScreen onDone={handleSplashDone} />
  if (!me) return <MemberSelect onSelect={setMe} />

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ padding: '14px 18px 10px', borderBottom: '0.5px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 500 }}>여행이야? 다들모여~</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
              성운·병수·태헌·용훈·혁·대근 · 6인
            </div>
          </div>
          <button onClick={() => setMe(null)} style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 20,
            border: '0.5px solid #e0e0e0', background: '#f5f5f5', color: '#888',
          }}>
            {me.name} ▾
          </button>
        </div>
      </div>

      {/* 확정 배너 */}
      <ConfirmedBanner confirmedDate={confirmedDate} />

      {/* 스텝바 */}
      <StepBar current={step} confirmed={!!confirmedDate} onChange={setStep} />

      {/* 페이지 콘텐츠 */}
      {step === 'vote' && <VotePage me={me} />}
      {step === 'prep' && <PrepPage me={me} onNext={() => setStep('cost')} />}
      {step === 'cost' && <CostPage />}
    </div>
  )
}
