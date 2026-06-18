export const MEMBERS = [
  { id: 'seongwoon', name: '성운', role: '드라이버', bg: '#E6F1FB', tc: '#0C447C' },
  { id: 'byeongsu',  name: '병수', role: '총무',    bg: '#E1F5EE', tc: '#085041' },
  { id: 'taeheon',  name: '태헌', role: '바베큐',  bg: '#FAEEDA', tc: '#633806' },
  { id: 'yonghun',  name: '용훈', role: '드라이버', bg: '#F3E6FB', tc: '#4C0C7C' },
  { id: 'hyeok',    name: '혁',   role: '장보기',  bg: '#FBE6E6', tc: '#7C0C0C' },
  { id: 'daekeun',  name: '대근', role: '장보기',  bg: '#F1EFE8', tc: '#44440E' },
]

// 7월/8월 2박3일 금~일 옵션 (가성비 순 배치)
export const DATE_OPTIONS = [
  // ── 7월 ──
  { id: 1,  start: '7/4(금)',  end: '7/6(일)',  day: '금→일', nights: 2, month: 7,
    note: '극성수기 직전 — 펜션 가장 저렴' },
  { id: 2,  start: '7/11(금)', end: '7/13(일)', day: '금→일', nights: 2, month: 7,
    note: null },
  { id: 3,  start: '7/18(금)', end: '7/20(일)', day: '금→일', nights: 2, month: 7,
    note: '극성수기 시작 — 물 가장 따뜻함' },
  { id: 4,  start: '7/25(금)', end: '7/27(일)', day: '금→일', nights: 2, month: 7,
    note: '극성수기 중반' },
  // ── 8월 ──
  { id: 5,  start: '8/1(금)',  end: '8/3(일)',  day: '금→일', nights: 2, month: 8,
    note: null },
  { id: 6,  start: '8/8(금)',  end: '8/10(일)', day: '금→일', nights: 2, month: 8,
    note: null },
  { id: 7,  start: '8/15(금)', end: '8/17(일)', day: '금→일', nights: 2, month: 8,
    note: '광복절 연휴 — 인파 많음, 미리 예약 필수' },
  { id: 8,  start: '8/22(금)', end: '8/24(일)', day: '금→일', nights: 2, month: 8,
    note: '성수기 막바지 — 가성비 ↑' },
  { id: 9,  start: '8/29(금)', end: '8/31(일)', day: '금→일', nights: 2, month: 8,
    note: '성수기 종료 직전 — 최저가 노릴 수 있음' },
]

// 공동 준비물
export const SHARED_ITEMS = [
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

// 개인 준비물
export const PERSONAL_ITEMS = [
  { id: 'p1', text: '수건 (계곡용)' },
  { id: 'p2', text: '수영복 / 반바지' },
  { id: 'p3', text: '슬리퍼' },
  { id: 'p4', text: '선크림' },
  { id: 'p5', text: '갈아입을 옷 (2벌)' },
  { id: 'p6', text: '세면도구' },
  { id: 'p7', text: '충전기' },
  { id: 'p8', text: '현금 (비상용)' },
]

// 비용 항목 (1인당 예상, 2박3일 6인 기준)
export const COST_ITEMS = [
  { id: 'c1', label: '숙소 (펜션)', perNight: true, amount: 0 },
  { id: 'c2', label: '식재료 (고기·야채)', perNight: false, amount: 60000 },
  { id: 'c3', label: '주류', perNight: false, amount: 30000 },
  { id: 'c4', label: '편의점 / 기타 식비', perNight: false, amount: 20000 },
  { id: 'c5', label: '유류비 (왕복)', perNight: false, amount: 30000 },
  { id: 'c6', label: '기타 잡비', perNight: false, amount: 10000 },
]
