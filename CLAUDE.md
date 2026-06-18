# 여행이야? 다들모여~ — Claude Code 컨텍스트

## 앱 개요
친구 6인(성운·병수·태헌·용훈·혁·대근) 전용 여행 플래너.
투표 → 준비물 → 정산 3단계 워크플로우.
Firebase Realtime DB로 실시간 동기화, Netlify 배포.

## 기술 스택
- **Frontend**: React 18 + Vite
- **Realtime DB**: Firebase Realtime Database (무료 Spark 플랜)
- **스타일**: CSS Modules (외부 UI 라이브러리 없음, 순수 CSS)
- **배포**: Netlify CLI (`netlify deploy --prod`)
- **아이콘**: Tabler Icons React

## 멤버 데이터 (members.js)
```js
export const MEMBERS = [
  { id: 'seongwoon', name: '성운', role: '드라이버' },
  { id: 'byeongsu',  name: '병수', role: '총무' },
  { id: 'taeheon',  name: '태헌', role: '바베큐' },
  { id: 'yonghun',  name: '용훈', role: '드라이버' },
  { id: 'hyeok',    name: '혁',   role: '장보기' },
  { id: 'daekeun',  name: '대근', role: '장보기' },
];
// 지헌은 이번 여행 불참 — 데이터에서 제외
```

## Firebase DB 구조
```
/trips/{tripId}/
  meta:
    title: string
    confirmedDate: string | null
  votes/{memberId}: dateOptionId (number)
  pensions/{pushId}:
    name, url, price, desc, who, createdAt
  checks/
    personal/{memberId}/{itemId}: boolean
    shared/{itemId}: boolean
```

## 주요 컴포넌트
- `pages/VotePage.jsx`   — 날짜 투표 + 펜션 공유 게시판 + 알림 버튼
- `pages/PrepPage.jsx`   — 개인/공동 준비물 체크리스트
- `pages/CostPage.jsx`   — 비용 정산 (1박/2박 전환, 6인 자동 계산)
- `components/ConfirmedBanner.jsx` — 확정! 배너 (상단 고정)
- `components/StepBar.jsx`         — 투표→준비물→정산 진행 표시
- `components/MemberSelect.jsx`    — 로그인 대신 이름 선택 (심플)
- `hooks/useFirebase.js`           — Firebase CRUD 훅

## 코딩 규칙
- 파일당 200줄 이하 유지
- 컴포넌트는 함수형 + hooks만
- CSS는 인라인 스타일 대신 CSS Module 사용
- Firebase 키는 반드시 `.env` (VITE_FIREBASE_*)
- 알림 버튼: 카카오 SDK 없이 클립보드 복사 방식으로 구현
- 한국어 주석 OK

## 배포 명령
```bash
npm run build
netlify deploy --prod --dir=dist
```

## 환경변수 (.env)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_TRIP_ID=trip_2026_summer
```
