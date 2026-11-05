// 백엔드 OpenAPI로 src/lib/api/schema.ts를 만듭니다.
// 백엔드 주소는 공개 저장소에 두지 않고 .env.local의 VITE_API_PROXY_TARGET에서 읽습니다.
import { spawnSync } from 'node:child_process'
import { loadEnv } from 'vite'

const target = loadEnv('development', process.cwd(), '').VITE_API_PROXY_TARGET
if (!target) {
  console.error('VITE_API_PROXY_TARGET이 없습니다. .env.example을 .env.local로 복사해서 백엔드 주소를 넣어 주세요.')
  process.exit(1)
}

const result = spawnSync(
  'npx',
  ['openapi-typescript', `${target.replace(/\/$/, '')}/openapi.json`, '-o', 'src/lib/api/schema.ts'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
)
process.exit(result.status ?? 1)
