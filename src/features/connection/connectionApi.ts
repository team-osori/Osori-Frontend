import {
  api,
  createIdempotencyKey,
  pathId,
  pollUntil,
  revisionTag,
  type PollOptions,
  type RequestExtras,
  type Schema,
} from '../../lib/api'
import { servicePath } from '../service/api'

/* 이 파일은 서비스 백엔드의 "서비스 연결" API입니다.
 * (같은 폴더의 api.ts는 화면 목업용 임시 함수라서 이름을 구분했습니다.) */

export type ConnectionResponse = Schema<'ConnectionResponse'>
/**
 * 서버가 받는 실행 방식. 명세에는 그냥 문자열이라고만 적혀 있지만 실제 서버는 이 두 값만 받습니다(그 외는 400 UNSUPPORTED_EXECUTION_MODE).
 * 이름으로 보면 PROMPT_BODY는 요청 본문에 시스템 프롬프트를 실어 보내는 방식(promptPointer 사용),
 * CONNECTION_ONLY는 챗봇이 자기 프롬프트를 쓰는 방식으로 보이지만 두 값의 정확한 차이는 확인하지 못했습니다.
 */
export const EXECUTION_MODES = ['PROMPT_BODY', 'CONNECTION_ONLY'] as const
export type ExecutionMode = (typeof EXECUTION_MODES)[number]
/** 연결 설정을 저장할 때 보내는 값. expectedRevision · method는 saveConnection이 채웁니다. */
export type ConnectionInput = Omit<Schema<'ConnectionPut'>, 'expectedRevision' | 'executionMode' | 'method'> & {
  executionMode: ExecutionMode
}
export type SecretResponse = Schema<'SecretResponse'>
export type ConnectionTest = Schema<'ConnectionTestResponse'>
export type ConnectionTestInput = { connectionRevision: number; question: string; promptVersionId?: string | null }
export type AuthType = Schema<'AuthConfig'>['type']

/** 서버가 허용하는 값의 범위 (명세 기준). 입력을 서버에 보내기 전에 화면에서 걸러낼 때 씁니다. */
export const CONNECTION_RULES = {
  /** 서버는 POST만 받습니다 */
  method: 'POST',
  urlMax: 2048,
  pointerMax: 500,
  timeoutMs: { min: 100, max: 60_000 },
  maxRetries: { min: 0, max: 2 },
  questionMax: 4000,
} as const

const connectionPath = (projectId: string, serviceId: string) => `${servicePath(projectId, serviceId)}/connection`

export function getConnection(projectId: string, serviceId: string, extras: RequestExtras = {}) {
  return api.get<ConnectionResponse>(connectionPath(projectId, serviceId), { signal: extras.signal })
}

/**
 * 연결 설정 저장 (처음 만들기 · 수정 모두).
 *
 * 서버는 낙관적 잠금을 씁니다. 수정할 때는 마지막으로 본 revision을 expectedRevision으로 보내야 하고,
 * 그 사이 다른 사람이 고쳤으면 409/412로 거절됩니다. 처음 만들 때는 0을 보냅니다.
 * 인증 키(secret)는 이 요청에 담지 않고 putSecret으로 따로 보냅니다.
 */
export function saveConnection(
  projectId: string,
  serviceId: string,
  input: ConnectionInput,
  /** 수정이면 지금 화면의 revision, 새로 만들면 생략 */
  currentRevision: number | null = null,
  extras: RequestExtras = {},
) {
  return api.put<ConnectionResponse>(
    connectionPath(projectId, serviceId),
    { ...input, method: CONNECTION_RULES.method, expectedRevision: currentRevision ?? 0 },
    { signal: extras.signal },
  )
}

/** 인증 키 저장. 연결 설정이 먼저 있어야 합니다(revision이 1 이상). 응답에는 키 값이 오지 않고 저장 여부만 옵니다. */
export function putSecret(projectId: string, serviceId: string, secret: string, expectedRevision: number, extras: RequestExtras = {}) {
  return api.put<SecretResponse>(`${connectionPath(projectId, serviceId)}/secret`, { secret, expectedRevision }, { signal: extras.signal })
}

/** 인증 키 삭제. revision을 If-Match로 보냅니다. */
export function deleteSecret(projectId: string, serviceId: string, revision: number, extras: RequestExtras = {}) {
  return api.delete(`${connectionPath(projectId, serviceId)}/secret`, { ifMatch: revisionTag(revision), signal: extras.signal })
}

/* ---------- 연결 테스트 (비동기) ---------- */

const testsPath = (projectId: string, serviceId: string) => `${servicePath(projectId, serviceId)}/connection-tests`

/** 테스트 요청. 바로 끝나지 않고 QUEUED 상태로 돌아옵니다. 중복 실행을 막으려고 Idempotency-Key를 붙입니다. */
export function startConnectionTest(projectId: string, serviceId: string, input: ConnectionTestInput, extras: RequestExtras & { idempotencyKey?: string } = {}) {
  return api.post<ConnectionTest>(testsPath(projectId, serviceId), input, {
    idempotencyKey: extras.idempotencyKey ?? createIdempotencyKey(),
    signal: extras.signal,
  })
}

export function getConnectionTest(projectId: string, serviceId: string, testId: string, extras: RequestExtras = {}) {
  return api.get<ConnectionTest>(`${testsPath(projectId, serviceId)}/${pathId(testId, '연결 테스트 ID')}`, { signal: extras.signal })
}

export const isConnectionTestDone = (test: ConnectionTest) => test.status === 'SUCCEEDED' || test.status === 'FAILED'

/**
 * 연결 테스트를 요청하고 끝날 때까지 기다려 결과를 돌려줍니다.
 * 성공/실패는 돌려주는 값의 status로 구분합니다(서버가 보낸 FAILED는 오류로 던지지 않음).
 */
export async function runConnectionTest(
  projectId: string,
  serviceId: string,
  input: ConnectionTestInput,
  options: Pick<PollOptions<ConnectionTest>, 'onUpdate' | 'signal' | 'intervalMs' | 'timeoutMs'> = {},
): Promise<ConnectionTest> {
  const started = await startConnectionTest(projectId, serviceId, input, { signal: options.signal })
  if (isConnectionTestDone(started)) return started
  return pollUntil<ConnectionTest>({
    ...options,
    fetch: (signal) => getConnectionTest(projectId, serviceId, started.id, { signal }),
    isDone: isConnectionTestDone,
  })
}

/**
 * 지금 연결 설정으로 이미 테스트에 성공했는지.
 * 설정을 고치면 revision이 올라가 이전 테스트가 무효가 되므로, 서버가 알려주는 verifiedRevision과 비교합니다.
 */
export const isConnectionVerified = (connection: Pick<ConnectionResponse, 'revision' | 'verifiedRevision'>) =>
  connection.verifiedRevision !== null && connection.verifiedRevision === connection.revision
