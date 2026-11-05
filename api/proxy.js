/**
 * Vercel 서버 함수: 배포 환경에서 /api/* 요청을 백엔드로 넘깁니다.
 *
 * - 개발 중에는 vite.config.ts의 프록시가 같은 일을 합니다.
 * - 백엔드 주소는 Vercel 환경 변수 VITE_API_PROXY_TARGET에서 읽습니다. 저장소에는 두지 않습니다.
 * - 백엔드가 http여도 서버끼리 통신이라 브라우저의 https → http 차단에 걸리지 않습니다.
 *
 * vercel.json이 /api/:path* 를 /api/proxy?__path=:path* 로 보냅니다.
 */

// 요청 · 응답에서 그대로 넘기면 안 되는 헤더
const DROP_REQUEST = ['host', 'origin', 'connection', 'content-length', 'x-forwarded-host']
const DROP_RESPONSE = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']

async function proxy(request) {
  const target = (process.env.VITE_API_PROXY_TARGET || '').replace(/\/$/, '')
  if (!target) {
    return Response.json({ detail: '서버에 VITE_API_PROXY_TARGET 환경 변수가 없습니다.' }, { status: 500 })
  }

  const url = new URL(request.url)
  const path = url.searchParams.get('__path') || ''
  url.searchParams.delete('__path')
  const query = url.searchParams.toString()
  const upstream = `${target}/api/${path}${query ? `?${query}` : ''}`

  const headers = new Headers(request.headers)
  for (const name of DROP_REQUEST) headers.delete(name)

  const hasBody = !['GET', 'HEAD'].includes(request.method)
  let response
  try {
    response = await fetch(upstream, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    })
  } catch {
    return Response.json({ detail: '백엔드 서버에 연결할 수 없습니다.' }, { status: 502 })
  }

  const out = new Headers(response.headers)
  for (const name of DROP_RESPONSE) out.delete(name)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: out })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
export const HEAD = proxy
