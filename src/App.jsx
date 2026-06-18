import { useState, useCallback, useEffect } from 'react'
import SplashScreen from './components/SplashScreen'
import AuthGate from './components/AuthGate'
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
import { useAuth } from './hooks/useAuth'
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

// 여행 내부 화면 (tripId, me 확정 후)
function TripApp({ tripId, me, onExit }) {
  const [step, setStep] = useState('vote')
  const { confirmedDate } = useConfirmedDate(tripId)
  const { meta } = useTripMeta(tripId)
  const { memberIds } = useTripMembers(tripId)
  const { options: dateOptions } = useTripDateOptions(tripId)
  const { signOutUser } = useAuth()

  return (
    <div style={styles.tripApp}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 500 }}>{meta?.title ?? '여행'}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>👥 {memberIds.length}명 참가</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setStep('vote')} style={styles.chipBtn}>{me.name} ▾</button>
          <button onClick={onExit} style={styles.chipBtn}>← 나가기</button>
          <button onClick={signOutUser} style={{ ...styles.chipBtn, color: '#A32D2D' }}>로그아웃</button>
        </div>
      </div>

      {/* 확정 배너 */}
      <ConfirmedBanner confirmedDate={confirmedDate} dateOptions={dateOptions} />

      {/* 스텝바 */}
      <StepBar current={step} confirmed={!!confirmedDate} onChange={setStep} />

      {/* 페이지 콘텐츠 */}
      <div style={styles.pageContent}>
        {step === 'vote' && <VotePage me={me} tripId={tripId} tripMembers={memberIds} />}
        {step === 'prep' && <PrepPage me={me} tripId={tripId} onNext={() => setStep('cost')} />}
        {step === 'cost' && <CostPage tripId={tripId} tripMembers={memberIds} />}
      </div>
    </div>
  )
}

// 앱 전체 진입점
export default function App() {
  const { friends, loading: friendsLoading } = useFriends()
  const { linkedFriendId } = useAuth()
  const [splashDone, setSplashDone] = useState(false)
  const [screen, setScreen] = useState('tripSelect')
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [me, setMe] = useState(null)

  // 친구가 한 명도 없으면 기본 멤버 자동 등록
  useEffect(() => {
    if (friendsLoading) return
    if (friends.length === 0) {
      DEFAULT_FRIENDS.forEach((f) => {
        set(ref(db, `friends/${f.id}`), { ...f, isActive: true, createdAt: Date.now() })
      })
    }
  }, [friendsLoading, friends.length])

  // 인증된 사용자의 linkedFriendId로 me 자동 설정
  useEffect(() => {
    if (linkedFriendId && friends.length > 0 && !me) {
      const linked = friends.find((f) => f.id === linkedFriendId)
      if (linked) setMe(linked)
    }
  }, [linkedFriendId, friends, me])

  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  const handleTripSelect = useCallback((tripId) => {
    setSelectedTripId(tripId)
    setScreen('tripSetup')
  }, [])

  const handleTripReady = useCallback((friend, tripId) => {
    setMe(friend)
    setScreen('trip')
  }, [])

  const handleExit = useCallback(() => {
    setMe(null)
    setSelectedTripId(null)
    setScreen('tripSelect')
  }, [])

  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />
  }

  return (
    <AuthGate>
      <div style={styles.appShell}>
        {screen === 'friends' && (
          <div style={styles.panelPage}>
            <FriendsPage onBack={() => setScreen('tripSelect')} />
          </div>
        )}

        {screen === 'tripSetup' && selectedTripId && (
          <div style={styles.panelPage}>
            <TripSetupPage
              tripId={selectedTripId}
              onReady={handleTripReady}
              onBack={() => setScreen('tripSelect')}
            />
          </div>
        )}

        {screen === 'trip' && selectedTripId && me && (
          <TripApp tripId={selectedTripId} me={me} onExit={handleExit} />
        )}

        {screen === 'tripSelect' && (
          <div style={styles.panelPage}>
            <TripSelectPage
              onSelect={handleTripSelect}
              onManageFriends={() => setScreen('friends')}
            />
          </div>
        )}
      </div>
    </AuthGate>
  )
}

const styles = {
  // 앱 전체 셸 — PC에서 사이드바 여백 역할
  appShell: {
    minHeight: '100vh',
    background: '#f4f4f4',
    display: 'flex',
    justifyContent: 'center',
  },
  // 단독 페이지 (TripSelect, FriendsPage 등) — 중앙 패널
  panelPage: {
    width: '100%',
    maxWidth: 520,
    background: '#fff',
    minHeight: '100vh',
    boxShadow: '0 0 40px rgba(0,0,0,0.06)',
  },
  // 여행 내부 — 더 넓게
  tripApp: {
    width: '100%',
    maxWidth: 680,
    background: '#fff',
    minHeight: '100vh',
    boxShadow: '0 0 40px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  pageContent: {
    flex: 1,
    overflowY: 'auto',
  },
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
