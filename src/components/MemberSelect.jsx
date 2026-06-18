import { MEMBERS } from '../constants'

// public/members/ 폴더에 {memberId}.jpg 파일 넣으면 자동으로 사용
// 예: public/members/seongwoon.jpg, public/members/byeongsu.jpg ...
// 없으면 이니셜 아바타로 fallback

function Avatar({ member }) {
  const src = `/members/${member.id}.jpg`
  return (
    <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: member.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={src}
        alt={member.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      <span style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: member.tc, fontWeight: 700 }}>
        {member.name[0]}
      </span>
    </div>
  )
}

export default function MemberSelect({ onSelect }) {
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#fff' }}>
      {/* 단체사진 헤더 */}
      <div style={{ position: 'relative', width: '100%', height: 240, overflow: 'hidden', background: '#222' }}>
        <img
          src="/friends.jpg"
          alt="우리들"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65))',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '20px 20px',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>🏞️ 여행이야? 다들모여~</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>성운·병수·태헌·용훈·혁·대근 · 2026 여름</div>
        </div>
      </div>

      {/* 멤버 선택 */}
      <div style={{ padding: '20px 18px 32px' }}>
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 14, fontWeight: 500 }}>나를 선택해줘 👇</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MEMBERS.map((m) => (
            <button key={m.id} onClick={() => onSelect(m)} style={{
              width: '100%', padding: '13px 16px', borderRadius: 14,
              border: '0.5px solid #ebebeb', background: '#f9f9f9',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}>
              <Avatar member={m} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#222' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>{m.role}</div>
              </div>
              <span style={{ fontSize: 18 }}>
                {m.name === '성운' ? '🚗' : m.name === '병수' ? '💰' : m.name === '태헌' ? '🔥' :
                 m.name === '용훈' ? '🚗' : m.name === '혁' ? '🛒' : '🛒'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
