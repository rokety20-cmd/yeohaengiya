import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'

function LoginScreen({ onSignIn, error }) {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏕️</div>
        <div style={s.title}>여행이야? 다들모여~</div>
        <div style={s.sub}>구글 계정으로 로그인하면 어디서든 여행을 함께 관리할 수 있어요</div>
        {error && <div style={s.error}>{error}</div>}
        <button style={s.googleBtn} onClick={onSignIn}>
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Google로 로그인
        </button>
      </div>
    </div>
  )
}

function LinkFriendScreen({ onLink }) {
  const { friends, loading } = useFriends()

  if (loading) return <div style={s.page}><div style={s.loadingText}>불러오는 중...</div></div>

  return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: 400 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
        <div style={s.title}>처음이시군요!</div>
        <div style={s.sub}>어느 분이세요? 한 번만 선택하면 다음부턴 자동으로 로그인돼요</div>
        <div style={{ width: '100%', marginTop: 16 }}>
          {friends.map((f) => (
            <button key={f.id} onClick={() => onLink(f.id)} style={s.friendBtn(f)}>
              <div style={s.avatar(f)}>{f.emoji ?? f.name[0]}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>{f.name}</div>
                {f.role && <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{f.role}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AuthGate({ children }) {
  const { user, linkedFriendId, loading, signInWithGoogle, linkToFriend } = useAuth()

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingText}>로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onSignIn={signInWithGoogle} />
  }

  if (!linkedFriendId) {
    return <LinkFriendScreen onLink={linkToFriend} />
  }

  return children
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f9f4 100%)', padding: 20,
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '36px 28px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 360,
  },
  title: { fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 },
  error: { background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16, width: '100%', boxSizing: 'border-box' },
  googleBtn: {
    width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid #e0e0e0',
    background: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#333',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  loadingText: { color: '#aaa', fontSize: 14 },
  friendBtn: (f) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
    padding: '12px 14px', borderRadius: 12, border: `1px solid ${f.bg ?? '#eee'}`,
    background: f.bg ?? '#f9f9f9', marginBottom: 8, cursor: 'pointer',
    transition: 'opacity 0.15s',
  }),
  avatar: (f) => ({
    width: 40, height: 40, borderRadius: '50%', background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
  }),
}
