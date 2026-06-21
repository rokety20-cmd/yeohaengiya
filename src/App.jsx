import { useState, useCallback, useEffect } from 'react'
import SplashScreen from './components/SplashScreen'
import ConfirmedBanner from './components/ConfirmedBanner'
import StepBar from './components/StepBar'
import TripSelectPage from './pages/TripSelectPage'
import TripSetupPage from './pages/TripSetupPage'
import FriendsPage from './pages/FriendsPage'
import VotePage from './pages/VotePage'
import PrepPage from './pages/PrepPage'
import CostPage from './pages/CostPage'
import { useConfirmedDate } from './hooks/useFirebase'
import { useTripMeta, useTripMembers, useTripDateOptions } from './hooks/useTrips'
import { useFriends } from './hooks/useFriends'
import { ref, set } from 'firebase/database'
import { db } from './firebase'

const DEFAULT_FRIENDS = [
  { id: 'seongwoon', name: '성운', role: '드라이버', emoji: '🚗', bg: '#E6F1FB', tc: '#0C447C', order: 0 },
  { id: 'byeongsu',  name: '병수', role: '총무',    emoji: '💰', bg: '#E1F5EE', tc: '#085041', order: 1 },
  { id: 'taeheon',  name: '태헌', role: '바베큐',  emoji: '🔥', bg: '#FAEEDA', tc: '#633806', order: 2 },
  { id: 'yonghun',  name: '용훈', role: '드라이버', emoji: '🚗', bg: '#F3E6FB', tc: '#4C0C7C', order: 3 },
  { id: 'hyeok',    name: '혁',   role: '장보기',  emoji: '🛒', bg: '#FBE6E6', tc: '#7C0C0C', order: 4 },
  { id: 'daekeun',  name: '대근', role: '장보기',  emoji: '🛒', bg: '#F1EFE8', tc: '#44440E', order: 5 },
]

function TripApp({ tripId, me, onExit }) {
  const [step, setStep] = useState('vote')
  const { confirmedDate } = useConfirmedDate(tripId)
  const { meta } = useTripMeta(tripId)
  const { memberIds } = useTripMembers(tripId)
  const { options: dateOptions } = useTripDateOptions(tripId)

  return (
    <div style={styles.tripApp}>
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 500 }}>{meta?.title ?? '여행'}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>👥 {memberIds.length}명 참가</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setStep('vote')} style={styles.chipBtn}>{me.name} ▾</button>
          <button onClick={onExit} style={styles.chipBtn}>← 나가기</button>
        </div>
      </div>

      <ConfirmedBanner confirmedDate={confirmedDate} dateOptions={dateOptions} />
      <StepBar current={step} confirmed={!!confirmedDate} onChange={setStep} />

      <div style={styles.pageContent}>
        {step === 'vote' && <VotePage me={me} tripId={tripId} tripMembers={memberIds} />}
        {step === 'prep' && <PrepPage me={me} tripId={tripId} onNext={() => setStep('cost')} />}
        {step === 'cost' && <CostPage me={me} tripId={tripId} tripMembers={memberIds} />}
      </div>
    </div>
  )
}

export default function App() {
  const { friends, loading: friendsLoading } = useFriends()
  const [splashDone, setSplashDone] = useState(false)
  const [screen, setScreen] = useState('tripSelect')
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [me, setMe] = useState(null)

  useEffect(() => {
    if (friendsLoading) return
    if (friends.length === 0) {
      DEFAULT_FRIENDS.forEach((f) => {
        set(ref(db, `friends/${f.id}`), { ...f, isActive: true, createdAt: Date.now() })
      })
    }
  }, [friendsLoading, friends.length])

  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  const handleTripSelect = useCallback((tripId) => {
    setSelectedTripId(tripId)
    setScreen('tripSetup')
  }, [])

  const handleTripReady = useCallback((friend) => {
    setMe(friend)
    setScreen('trip')
  }, [])

  const handleExit = useCallback(() => {
    setMe(null)
    setSelectedTripId(null)
    setScreen('tripSelect')
  }, [])

  return (
    <div className="app-frame">
      {/* 스플래시: 프레임 안에서만 덮음 */}
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      {splashDone && (
        <>
          {screen === 'friends' && (
            <FriendsPage onBack={() => setScreen('tripSelect')} />
          )}
          {screen === 'tripSetup' && selectedTripId && (
            <TripSetupPage
              tripId={selectedTripId}
              onReady={handleTripReady}
              onBack={() => setScreen('tripSelect')}
            />
          )}
          {screen === 'trip' && selectedTripId && me && (
            <TripApp tripId={selectedTripId} me={me} onExit={handleExit} />
          )}
          {screen === 'tripSelect' && (
            <TripSelectPage
              onSelect={handleTripSelect}
              onManageFriends={() => setScreen('friends')}
            />
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  tripApp: {
    width: '100%',
    background: '#fff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  pageContent: { flex: 1, overflowY: 'auto' },
  header: {
    padding: '14px 18px 10px',
    borderBottom: '0.5px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chipBtn: {
    fontSize: 12, padding: '4px 10px', borderRadius: 20,
    border: '0.5px solid #e0e0e0', background: '#f5f5f5', color: '#888', cursor: 'pointer',
  },
}
