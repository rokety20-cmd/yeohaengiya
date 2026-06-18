# 여행이야? 다들모여~

친구 6인(성운·병수·태헌·용훈·혁·대근) 전용 여행 플래너.  
투표 → 준비물 → 정산 3단계 · Firebase 실시간 동기화 · Netlify 배포.

---

## 1단계 — Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속 → 새 프로젝트 생성
2. **Realtime Database** → 데이터베이스 만들기 → **테스트 모드** 선택
3. 프로젝트 설정 → 일반 → 웹 앱 추가 → SDK 설정 값 복사

---

## 2단계 — 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 Firebase 콘솔에서 복사한 값 붙여넣기:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-app-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
VITE_TRIP_ID=trip_2026_summer
```

---

## 3단계 — 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 열기

---

## 4단계 — Netlify 배포

```bash
npm install -g netlify-cli
npm run build
netlify login
netlify deploy --prod --dir=dist
```

배포 완료 후 나오는 URL을 카카오톡 단체방에 공유하면 끝!

> **Netlify 환경변수**: Netlify 대시보드 → Site settings → Environment variables 에  
> `.env`와 동일한 키-값 쌍 전부 등록 필요 (빌드 시 사용됨)

---

## Firebase 보안 규칙 (선택 — 공개 후 설정 권장)

```json
{
  "rules": {
    "trips": {
      "$tripId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

---

## 폴더 구조

```
src/
  components/
    MemberSelect.jsx   ← 이름 선택 화면
    ConfirmedBanner.jsx ← 확정! 배너
    StepBar.jsx        ← 3단계 진행 표시
  hooks/
    useFirebase.js     ← Firebase 실시간 훅 모음
  pages/
    VotePage.jsx       ← 날짜 투표 + 펜션 공유 + 알림
    PrepPage.jsx       ← 준비물 체크리스트
    CostPage.jsx       ← 비용 정산
  constants.js         ← 멤버·날짜·체크리스트 데이터
  firebase.js          ← Firebase 초기화
  App.jsx              ← 루트 라우팅
```
