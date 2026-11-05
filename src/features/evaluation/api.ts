import {
  api,
  createIdempotencyKey,
  pathId,
  pollUntil,
  type Page,
  type PageQuery,
  type PollOptions,
  type RequestExtras,
  type Schema,
} from '../../lib/api'
import { servicePath } from '../service/api'

/* 평가는 같은 질문 세트로 프롬프트 두 개(A, B)를 비교하거나(COMPARE), 프롬프트 하나만 채점합니다(SINGLE).
 * 요청하면 바로 끝나지 않고 QUEUED 상태로 돌아오고, 같은 평가를 다시 조회해서 진행 상황을 확인합니다. */

export type Evaluation = Schema<'EvaluationResponse'>
export type EvaluationStatus = Evaluation['status']
export type EvaluationInputs = Schema<'EvaluationInputs'>
export type EvaluationSummary = Schema<'EvaluationSummary'>
export type EvaluationItemSummary = Schema<'EvaluationItemSummary'>
export type EvaluationItem = Schema<'EvaluationItemResponse'>
export type EvaluationSide = Schema<'EvaluationSide'>

/** 평가 기준 4가지 */
export const EVALUATION_CRITERIA = ['retrieval', 'grounding', 'response', 'policy'] as const
export type EvaluationCriterion = (typeof EVALUATION_CRITERIA)[number]

/** A에서 B로 바뀌며 결과가 어떻게 달라졌는지 */
export const EVALUATION_CHANGES = ['IMPROVED', 'WORSENED', 'UNCHANGED_PASS', 'UNCHANGED_FAIL', 'NOT_COMPARABLE'] as const
export type EvaluationChange = (typeof EVALUATION_CHANGES)[number]

/** COMPARE는 A/B 두 프롬프트를 비교하고, SINGLE은 프롬프트 하나만 채점합니다. 서버 기본값은 COMPARE. */
export type EvaluationMode = NonNullable<Schema<'EvaluationCreate'>['mode']>

type EvaluationBase = {
  /** 평가할 때 쓴 연결 설정의 revision. 연결 테스트를 통과한 revision이어야 합니다. */
  connectionRevision: number
  /** 확정된(confirmed) 테스트셋 버전 */
  testSetVersionId: string
}
export type EvaluationInput =
  | (EvaluationBase & { mode?: 'COMPARE'; aPromptVersionId: string; bPromptVersionId: string })
  | (EvaluationBase & {
      mode: 'SINGLE'
      /**
       * 채점할 프롬프트 버전. 생략하면 서버가 연결 설정에 이미 들어 있는 프롬프트를 쓰는 것으로 보입니다
       * (평가 입력 기록에 useConfiguredPrompt 항목이 있음). 명세에 이 규칙이 적혀 있지 않아 실제 서버로 확인이 필요합니다.
       */
      promptVersionId?: string
    })

export type EvaluationItemQuery = PageQuery & {
  /** 이 기준에서 실패한 질문만 보기 등 기준별 필터 */
  criterion?: EvaluationCriterion
  /** 변화 종류별 필터 */
  change?: EvaluationChange
}

const evaluationsPath = (projectId: string, serviceId: string) => `${servicePath(projectId, serviceId)}/evaluations`
const evaluationPath = (projectId: string, serviceId: string, evaluationId: string) =>
  `${evaluationsPath(projectId, serviceId)}/${pathId(evaluationId, '평가 ID')}`

/** 평가가 더 진행되지 않는 상태 (COMPLETED · PARTIAL_FAILED · FAILED) */
export const isEvaluationFinished = (evaluation: Pick<Evaluation, 'status'>) =>
  evaluation.status === 'COMPLETED' || evaluation.status === 'PARTIAL_FAILED' || evaluation.status === 'FAILED'

/**
 * 평가 요청. QUEUED 상태의 평가가 바로 돌아옵니다.
 * 같은 평가가 두 번 만들어지지 않도록 Idempotency-Key를 붙입니다. 네트워크 오류 뒤에 다시 시도할 때는 같은 키를 넘기세요.
 */
export function startEvaluation(
  projectId: string,
  serviceId: string,
  input: EvaluationInput,
  extras: RequestExtras & { idempotencyKey?: string } = {},
) {
  const common = {
    connectionRevision: input.connectionRevision,
    testSetVersionId: pathId(input.testSetVersionId, '테스트셋 버전 ID'),
  }
  // 모드에 맞는 값만 보냅니다. SINGLE에 A/B를 같이 보내면 서버가 어느 쪽을 쓸지 모호해집니다.
  const body =
    input.mode === 'SINGLE'
      ? {
          ...common,
          mode: 'SINGLE' as const,
          ...(input.promptVersionId ? { promptVersionId: pathId(input.promptVersionId, '프롬프트 버전 ID') } : {}),
        }
      : {
          ...common,
          mode: 'COMPARE' as const,
          aPromptVersionId: pathId(input.aPromptVersionId, 'A 프롬프트 버전 ID'),
          bPromptVersionId: pathId(input.bPromptVersionId, 'B 프롬프트 버전 ID'),
        }
  return api.post<Evaluation>(evaluationsPath(projectId, serviceId), body, {
    idempotencyKey: extras.idempotencyKey ?? createIdempotencyKey(),
    signal: extras.signal,
  })
}

export function listEvaluations(projectId: string, serviceId: string, query: PageQuery & RequestExtras = {}) {
  const { signal, limit, cursor } = query
  return api.get<Page<Evaluation>>(evaluationsPath(projectId, serviceId), { query: { limit, cursor }, signal })
}

export function getEvaluation(projectId: string, serviceId: string, evaluationId: string, extras: RequestExtras = {}) {
  return api.get<Evaluation>(evaluationPath(projectId, serviceId, evaluationId), { signal: extras.signal })
}

/** 평가를 요청하고 끝날 때까지 진행 상황을 확인합니다. 끝난 평가(성공 · 일부 실패 · 실패 모두)를 돌려줍니다. */
export async function runEvaluation(
  projectId: string,
  serviceId: string,
  input: EvaluationInput,
  options: Pick<PollOptions<Evaluation>, 'onUpdate' | 'signal' | 'intervalMs' | 'timeoutMs'> & {
    idempotencyKey?: string
  } = {},
): Promise<Evaluation> {
  const { idempotencyKey, ...pollOptions } = options
  const started = await startEvaluation(projectId, serviceId, input, { idempotencyKey, signal: options.signal })
  pollOptions.onUpdate?.(started)
  if (isEvaluationFinished(started)) return started
  return pollUntil<Evaluation>({
    ...pollOptions,
    fetch: (signal) => getEvaluation(projectId, serviceId, started.id, { signal }),
    isDone: isEvaluationFinished,
  })
}

/** 평가를 시작할 때 고정한 입력(연결 · 프롬프트 · 질문 세트 · 기준 · 심사 설정)의 기록 */
export function getEvaluationInputs(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  extras: RequestExtras = {},
) {
  return api.get<EvaluationInputs>(`${evaluationPath(projectId, serviceId, evaluationId)}/inputs`, {
    signal: extras.signal,
  })
}

/** 기준별 A/B 통과율과 변화 집계. 아직 진행 중이면 provisional(잠정치)이 true입니다. */
export function getEvaluationSummary(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  extras: RequestExtras = {},
) {
  return api.get<EvaluationSummary>(`${evaluationPath(projectId, serviceId, evaluationId)}/summary`, {
    signal: extras.signal,
  })
}

/** 질문별 결과 목록 */
export function listEvaluationItems(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  query: EvaluationItemQuery & RequestExtras = {},
) {
  const { signal, limit, cursor, criterion, change } = query
  return api.get<Page<EvaluationItemSummary>>(`${evaluationPath(projectId, serviceId, evaluationId)}/items`, {
    query: { limit, cursor, criterion, change },
    signal,
  })
}

/** 질문 하나의 A/B 답변 · 근거 · 심사 결과 전체 */
export function getEvaluationItem(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  itemId: string,
  extras: RequestExtras = {},
) {
  return api.get<EvaluationItem>(
    `${evaluationPath(projectId, serviceId, evaluationId)}/items/${pathId(itemId, '평가 항목 ID')}`,
    { signal: extras.signal },
  )
}
