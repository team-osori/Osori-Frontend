import { api } from './client'
import type { RequestExtras } from './path'

/** 서버 상태 응답. 다른 API와 달리 { data }로 감싸지 않은 단순한 객체입니다. */
export type HealthStatus = Record<string, string>

/** 서버 프로세스가 떠 있는지 (DB는 확인하지 않음). 로그인 없이 부를 수 있습니다. */
export function getHealth(extras: RequestExtras = {}) {
  return api.get<HealthStatus>('/api/health', { auth: false, signal: extras.signal })
}

/** DB 연결까지 확인하고, 지금 배포된 서버 버전(revision)을 알려줍니다. */
export function getReady(extras: RequestExtras = {}) {
  return api.get<HealthStatus>('/api/ready', { auth: false, signal: extras.signal })
}
