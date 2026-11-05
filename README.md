# Osori Frontend

Osori는 AI 챗봇의 프롬프트를 같은 질문과 기준으로 비교하고, 배포 전 정책에 어긋나는 응답을 확인할 수 있도록 돕는 서비스입니다.

프론트엔드는 React, TypeScript, Vite로 구성합니다. 현재는 초기 개발 골격이며 서비스 기능은 구현 예정입니다.

## 실행

Node.js 20.19+ 또는 22.12+가 필요합니다.

```bash
npm install
npm run dev
```

```bash
npm run build
```

## API

백엔드: [Osori-Backend](https://github.com/team-osori/Osori-Backend)

서버 주소는 공개 저장소에 적지 않습니다. `.env.example`을 `.env.local`로 복사하고, 팀 내부에서 공유받은 주소를 넣습니다. `.env.local`은 커밋되지 않습니다.

개발 서버는 `/api` 요청을 `VITE_API_PROXY_TARGET`으로 넘깁니다. 백엔드 CORS가 허용하는 출처가 정해져 있어서, 화면은 같은 출처의 `/api`로 요청하고 프록시가 대신 보냅니다.

| 환경 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | API 주소. 비우면 같은 출처의 `/api` (개발 서버 프록시). 배포할 때만 넣습니다 |
| `VITE_API_PROXY_TARGET` | 개발 서버 프록시가 넘길 백엔드 주소. 타입 생성(`npm run api:types`)도 이 주소를 씁니다 |

백엔드 스키마가 바뀌면 타입을 다시 만듭니다.

```bash
npm run api:types   # src/lib/api/schema.ts 생성
```

요청은 `src/lib/api`의 `api`를 씁니다. 토큰 첨부, 401일 때 토큰 갱신 후 재시도, `{ data }` 꺼내기, 오류를 `ApiError`로 바꾸는 일을 대신 합니다.

```ts
import { api, type Page, type Schema } from '../lib/api'

type Project = Schema<'ProjectResponse'>

const page = await api.get<Page<Project>>('/api/projects', { query: { limit: 20 } })
await api.post('/api/projects/p1/services/s1/evaluations', body, { idempotencyKey: true })
```
