/**
 * 롤백 스크립트: 백업 JSON → Firebase 전체 복원
 *
 * 사용법:
 *   node scripts/rollback.js scripts/backup_1234567890.json
 *
 * ⚠️ 현재 DB 전체를 백업 시점으로 덮어씁니다.
 */
import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backupFile = process.argv[2]

if (!backupFile) {
  console.error('사용법: node scripts/rollback.js <백업파일경로>')
  process.exit(1)
}

async function main() {
  const backupData = JSON.parse(readFileSync(resolve(backupFile), 'utf-8'))
  const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: serviceAccount.databaseURL || `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app` })
  const db = admin.database()

  console.log(`🔄 롤백 시작: ${backupFile}`)
  await db.ref('/').set(backupData)
  console.log('✅ 롤백 완료')
  await db.app.delete()
}

main().catch((e) => { console.error(e); process.exit(1) })
