// 친구와 날짜 후보는 Firebase에 저장합니다.
// constants.js는 UI 템플릿·색상 팔레트만 보관합니다.

// 친구 프로필 색상 팔레트 (새 친구 추가 시 순환 사용)
export const FRIEND_COLORS = [
  { bg: '#E6F1FB', tc: '#0C447C' },
  { bg: '#E1F5EE', tc: '#085041' },
  { bg: '#FAEEDA', tc: '#633806' },
  { bg: '#F3E6FB', tc: '#4C0C7C' },
  { bg: '#FBE6E6', tc: '#7C0C0C' },
  { bg: '#F1EFE8', tc: '#44440E' },
  { bg: '#E8F4FF', tc: '#004080' },
  { bg: '#FFF3E0', tc: '#7C4300' },
]

// 역할 이모지 기본값 (친구 추가 시 선택)
export const ROLE_EMOJIS = ['🚗', '💰', '🔥', '🛒', '🏕️', '🎵', '📸', '🍳']

// 공동 준비물 기본 템플릿
export const DEFAULT_SHARED_ITEMS = [
  { id: 's1', text: '숯 + 착화제' },
  { id: 's2', text: '바베큐 그릴 / 석쇠' },
  { id: 's3', text: '고기 (삼겹살·목살)' },
  { id: 's4', text: '쌈채소 + 장류' },
  { id: 's5', text: '소주 + 맥주' },
  { id: 's6', text: '음료수 / 물' },
  { id: 's7', text: '일회용 접시·수저' },
  { id: 's8', text: '쓰레기봉투' },
  { id: 's9', text: '간식 (라면·과자)' },
  { id: 's10', text: '블루투스 스피커' },
]

// 개인 준비물 기본 템플릿
export const DEFAULT_PERSONAL_ITEMS = [
  { id: 'p1', text: '수건 (계곡용)' },
  { id: 'p2', text: '수영복 / 반바지' },
  { id: 'p3', text: '슬리퍼' },
  { id: 'p4', text: '선크림' },
  { id: 'p5', text: '갈아입을 옷 (2벌)' },
  { id: 'p6', text: '세면도구' },
  { id: 'p7', text: '충전기' },
  { id: 'p8', text: '현금 (비상용)' },
]

// 비용 항목 기본 템플릿 (1인당 예상금액, 실제값은 사용자가 입력)
export const DEFAULT_COST_ITEMS = [
  { id: 'c1', label: '숙소 (펜션)', perNight: true, amount: 0 },
  { id: 'c2', label: '식재료 (고기·야채)', perNight: false, amount: 60000 },
  { id: 'c3', label: '주류', perNight: false, amount: 30000 },
  { id: 'c4', label: '편의점 / 기타 식비', perNight: false, amount: 20000 },
  { id: 'c5', label: '유류비 (왕복)', perNight: false, amount: 30000 },
  { id: 'c6', label: '기타 잡비', perNight: false, amount: 10000 },
]
