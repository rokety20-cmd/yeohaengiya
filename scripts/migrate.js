/**
 * 마이그레이션 스크립트: 하드코딩 데이터 → Firebase
 *
 * 용도:
 *   기존 constants.js의 MEMBERS, DATE_OPTIONS를
 *   Firebase /friends/ 와 /trips/{tripId}/dateOptions/ 로 이전합니다.
 *
 * 사용법:
 *   1. 먼저 서비스 계정 키를 다운로드하세요.
 *      Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
 *   2. 다운로드한 키 파일을 scripts/serviceAccountKey.json 으로 저장하세요.
 *   3. npm install firebase-admin --save-dev
 *   4. dry-run (실제 쓰기 없음):
 *      DRY_RUN=true TRIP_ID=trip_2026_summer node scripts/migrate.js
 *   5. 실제 실행:
 *      TRIP_ID=trip_2026_summer node scripts/migrate.js
 *
 * 보장 사항:
 *   - idempotent: 두 번 실행해도 중복 생성 없음 (기존 ID 체크)
 *   - dry-run: 실제 DB 변경 없이 변환 결과 미리보기
 *   - 실패 시 롤백: 백업 JSON이 생성됩니다.
 *
 * ⚠️ 운영 DB에 실행 전 반드시 dry-run 먼저 확인하세요.
 */

import admin from 'firebase-admin'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DRY_RUN = process.env.DRY_RUN === 'true'
const TRIP_ID = process.env.TRIP_ID || 'trip_2026_summer'

// ── 기존 하드코딩 데이터 ──────────────────────────────────────────
const LEGACY_MEMBERS = [
  { id: 'seongwoon', name: '성운', role: '드라이버', bg: '#E6F1FB', tc: '#0C447C', emoji: '🚗', order: 0 },
  { id: 'byeongsu',  name: '병수', role: '총무',    bg: '#E1F5EE', tc: '#085041', emoji: '💰', order: 1 },
  { id: 'taeheon',  name: '태헌', role: '바베큐',  bg: '#FAEEDA', tc: '#633806', emoji: '🔥', order: 2 },
  { id: 'yonghun',  name: '용훈', role: '드라이버', bg: '#F3E6FB', tc: '#4C0C7C', emoji: '🚗', order: 3 },
  { id: 'hyeok',    name: '혁',   role: '장보기',  bg: '#FBE6E6', tc: '#7C0C0C', emoji: '🛒', order: 4 },
  { id: 'daekeun',  name: '대근', role: '장보기',  bg: '#F1EFE8', tc: '#44440E', emoji: '🛒', order: 5 },
]

const LEGACY_DATE_OPTIONS = [
  { id: 'opt_1',  start: '7/4(금)',  end: '7/6(일)',  nights: 2, note: '극성수기 직전 — 펜션 가장 저렴' },
  { id: 'opt_2',  start: '7/11(금)', end: '7/13(일)', nights: 2, note: null },
  { id: 'opt_3',  start: '7/18(금)', end: '7/20(일)', nights: 2, note: '극성수기 시작 — 물 가장 따뜻함' },
  { id: 'opt_4',  start: '7/25(금)', end: '7/27(일)', nights: 2, note: '극성수기 중반' },
  { id: 'opt_5',  start: '8/1(금)',  end: '8/3(일)',  nights: 2, note: null },
  { id: 'opt_6',  start: '8/8(금)',  end: '8/10(일)', nights: 2, note: null },
  { id: 'opt_7',  start: '8/15(금)', end: '8/17(일)', nights: 2, note: '광복절 연휴 — 인파 많음, 미리 예약 필수' },
  { id: 'opt_8',  start: '8/22(금)', end: '8/24(일)', nights: 2, note: '성수기 막바지 — 가성비 ↑' },
  { id: 'opt_9',  start: '8/29(금)', end: '8/31(일)', nights: 2, note: '성수기 종료 직전 — 최저가 노릴 수 있음' },
]

// ── 실행 ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 마이그레이션 시작 (DRY_RUN=${DRY_RUN}, TRIP_ID=${TRIP_ID})\n`)

  let serviceAccount
  try {
    serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))
  } catch {
    console.error('❌ scripts/serviceAccountKey.json 파일이 없습니다.')
    console.error('   Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 후 저장하세요.')
    process.exit(1)
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: serviceAccount.databaseURL || `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app` })
  const db = admin.database()

  // ── 백업 ──────────────────────────────────────────────────────
  console.log('📦 현재 DB 백업 중...')
  const snapshot = await db.ref('/').once('value')
  const backupData = snapshot.val()
  const backupPath = join(__dirname, `backup_${Date.now()}.json`)
  if (!DRY_RUN) {
    writeFileSync(backupPath, JSON.stringify(backupData, null, 2))
    console.log(`✅ 백업 저장: ${backupPath}`)
  } else {
    console.log(`[DRY_RUN] 백업 스킵 (실제 실행 시 ${backupPath} 에 저장됩니다)`)
  }

  const warnings = []
  const changes = []

  // ── 1. 친구 이전 ──────────────────────────────────────────────
  console.log('\n👥 친구 이전...')
  const existingFriends = backupData?.friends ?? {}

  for (const m of LEGACY_MEMBERS) {
    if (existingFriends[m.id]) {
      console.log(`  ⏭️  ${m.name} (${m.id}) — 이미 존재, 스킵`)
      continue
    }
    const friendData = { ...m, isActive: true, createdAt: Date.now() }
    changes.push({ path: `friends/${m.id}`, data: friendData })
    console.log(`  ✅ ${m.name} (${m.id}) 추가 예정`)
    if (!DRY_RUN) {
      await db.ref(`friends/${m.id}`).set(friendData)
    }
  }

  // ── 2. 여행 메타 이전 ──────────────────────────────────────────
  console.log(`\n✈️  여행 메타 이전 (${TRIP_ID})...`)
  const existingTrip = backupData?.trips?.[TRIP_ID]

  if (!existingTrip?.meta?.title) {
    const tripMeta = {
      title: '2026 여름 펜션',
      destination: '강원도',
      status: 'planning',
      confirmedDate: existingTrip?.meta?.confirmedDate ?? null,
      createdAt: Date.now(),
    }
    changes.push({ path: `trips/${TRIP_ID}/meta`, data: tripMeta })
    console.log(`  ✅ 여행 메타 생성 예정`)
    if (!DRY_RUN) {
      await db.ref(`trips/${TRIP_ID}/meta`).update(tripMeta)
    }
  } else {
    console.log(`  ⏭️  여행 메타 이미 존재, 스킵`)
  }

  // ── 3. 참가자 이전 ─────────────────────────────────────────────
  console.log(`\n👤 참가자 이전 (${TRIP_ID})...`)
  const existingMembers = existingTrip?.members ?? {}
  for (const m of LEGACY_MEMBERS) {
    if (existingMembers[m.id] === true) {
      console.log(`  ⏭️  ${m.name} — 이미 참가자, 스킵`)
      continue
    }
    changes.push({ path: `trips/${TRIP_ID}/members/${m.id}`, data: true })
    console.log(`  ✅ ${m.name} 참가자 추가 예정`)
    if (!DRY_RUN) {
      await db.ref(`trips/${TRIP_ID}/members/${m.id}`).set(true)
    }
  }

  // ── 4. 날짜 후보 이전 ─────────────────────────────────────────
  console.log(`\n📅 날짜 후보 이전 (${TRIP_ID})...`)
  const existingDateOpts = existingTrip?.dateOptions ?? {}

  for (const opt of LEGACY_DATE_OPTIONS) {
    if (existingDateOpts[opt.id]) {
      console.log(`  ⏭️  ${opt.start} — 이미 존재, 스킵`)
      continue
    }

    // 기존 votes 검증: 기존 숫자 ID (1~9)가 있으면 경고
    const existingVotes = existingTrip?.votes ?? {}
    const hasOldVotes = Object.values(existingVotes).some((v) => typeof v === 'number')
    if (hasOldVotes) {
      warnings.push(`votes/${TRIP_ID}: 기존 투표가 숫자 ID (1~9)로 저장되어 있습니다. 새 문자열 ID (opt_1~)와 호환되지 않습니다. 투표를 초기화하거나 수동으로 변환이 필요합니다.`)
    }

    const optData = { ...opt, order: LEGACY_DATE_OPTIONS.indexOf(opt) * 100 }
    changes.push({ path: `trips/${TRIP_ID}/dateOptions/${opt.id}`, data: optData })
    console.log(`  ✅ ${opt.start}~${opt.end} 추가 예정`)
    if (!DRY_RUN) {
      await db.ref(`trips/${TRIP_ID}/dateOptions/${opt.id}`).set(optData)
    }
  }

  // ── 최종 보고 ─────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60))
  console.log(`📋 변경 예정 항목: ${changes.length}개`)
  if (DRY_RUN) {
    console.log('\n[DRY_RUN 결과 — 실제 DB는 변경되지 않았습니다]')
    changes.forEach((c) => console.log(`  WRITE ${c.path}`))
  } else {
    console.log('✅ 마이그레이션 완료')
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  경고:')
    warnings.forEach((w) => console.log(`  - ${w}`))
  }

  console.log('\n🔄 롤백 방법:')
  console.log(`  node scripts/rollback.js ${backupPath}`)
  console.log('')

  await db.app.delete()
}

main().catch((e) => { console.error(e); process.exit(1) })
