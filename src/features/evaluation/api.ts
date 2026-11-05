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
/** 채점 화면 칸 전체(단일 평가 전용). 문항별 화면 상태 · 담당자 O/X를 답변 원문 없이 한 번에 줍니다. */
export type GradingBoard = Schema<'GradingBoard'>
export type GradingTile = Schema<'GradingTile'>
export type ScreenStatus = GradingTile['screenStatus']
export type ScreenCounts = Schema<'ScreenCounts'>

/**
 * 서버가 요약 · 항목 결과에 실제로 담아 주는 평가 기준 3가지.
 * 요약(summary)과 항목의 criteria는 이 이름을 키로 하는 객체입니다. (명세상 키가 고정돼 있지 않은 자유 객체)
 */
export const EVALUATION_CRITERIA = ['policy', 'questionResolution', 'communicationQuality'] as const
export type EvaluationCriterion = (typeof EVALUATION_CRITERIA)[number]
/**
 * 명세는 항목 필터의 criterion에 예전 기준(retrieval · grounding · response)도 허용한다고 적혀 있지만,
 * 실제 서버는 "이 평가에 포함된 기준"만 받고 나머지는 400 INVALID_CRITERION으로 거절합니다. 그래서 타입을 실제 3개로 제한했습니다.
 */
export type EvaluationFilterCriterion = EvaluationCriterion

/** 항목 판정 결과 */
export const EVALUATION_RESULT_STATUSES = ['MET', 'UNMET', 'REVIEW_REQUIRED', 'JUDGMENT_ERROR', 'EXECUTION_ERROR', 'NOT_RUN', 'IN_PROGRESS'] as const
export type EvaluationResultStatus = (typeof EVALUATION_RESULT_STATUSES)[number]
/** 답변의 문제 종류 */
export const EVALUATION_ISSUE_KINDS = ['condition_omitted', 'policy_contradiction', 'unsupported_claim', 'incomplete_guidance', 'non_answer', 'unclear_answer', 'other'] as const
export type EvaluationIssueKind = (typeof EVALUATION_ISSUE_KINDS)[number]

export type ItemReview = Schema<'ReviewOut'>
export type ReviewVerdict = Schema<'ReviewCreate'>['verdict']
export type ItemReviewInput = {
  /** 항목을 마지막으로 본 reviewRevision (처음이면 0) */
  expectedRevision: number
  /** 어느 쪽 답변을 판정하는지. 서버 기본값은 a */
  side?: 'a' | 'b'
  /** 판정할 조건(expectedCondition)의 ID */
  conditionId: string
  verdict: ReviewVerdict
  reason: string
}

/** 답변 전체 O/X 판정 기록 (조건별 판정과 별개) */
export type AnswerReview = Schema<'AnswerReviewOut'>
export type AnswerReviewInput = {
  /** 항목을 마지막으로 본 reviewRevision (처음이면 0). 조건별 판정과 같은 revision을 함께 씁니다. */
  expectedRevision: number
  /** 어느 쪽 답변을 판정하는지. 서버 기본값은 a */
  side?: 'a' | 'b'
  verdict: ReviewVerdict
  /** 선택. 비워 두면 보내지 않습니다. */
  reason?: string
}
export type EvaluationRerunInput = { connectionRevision: number; promptVersionId?: string }

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
  /** 판정 결과별 필터 */
  resultStatus?: EvaluationResultStatus
  /** 문제 종류별 필터 */
  issueKind?: EvaluationIssueKind
} & (
    | {
        /** 기준별 필터 */
        criterion?: EvaluationFilterCriterion
        change?: undefined
      }
    | {
        /**
         * 변화 종류별 필터(A에서 B로). 실제 서버는 change를 criterion과 함께만 받습니다
         * (criterion 없이 보내면 400 "change 필터에는 criterion이 필요합니다"). 명세에는 이 규칙이 없습니다.
         */
        change: EvaluationChange
        criterion: EvaluationFilterCriterion
      }
  )

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
  return waitForEvaluation(projectId, serviceId, started, pollOptions)
}

/** 이미 시작된 평가(시작 · 재실행 응답)가 끝날 때까지 진행 상황을 확인합니다. */
export async function waitForEvaluation(
  projectId: string,
  serviceId: string,
  started: Evaluation,
  options: Pick<PollOptions<Evaluation>, 'onUpdate' | 'signal' | 'intervalMs' | 'timeoutMs'> = {},
): Promise<Evaluation> {
  options.onUpdate?.(started)
  if (isEvaluationFinished(started)) return started
  return pollUntil<Evaluation>({
    ...options,
    fetch: (signal) => getEvaluation(projectId, serviceId, started.id, { signal }),
    isDone: isEvaluationFinished,
  })
}

/**
 * 끝난 평가를 새 연결 revision · 프롬프트로 다시 실행합니다. 새 평가가 QUEUED로 돌아오고
 * (sourceEvaluationId가 원래 평가), 끝날 때까지는 waitForEvaluation으로 확인합니다.
 * 실제 서버는 "종료한 단일(SINGLE) 평가"만 재실행할 수 있게 하고, 그 외에는 409 INVALID_REEVALUATION_SOURCE로 거절합니다.
 */
export function rerunEvaluation(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  input: EvaluationRerunInput,
  extras: RequestExtras & { idempotencyKey?: string } = {},
) {
  return api.post<Evaluation>(
    `${evaluationPath(projectId, serviceId, evaluationId)}/reruns`,
    {
      connectionRevision: input.connectionRevision,
      ...(input.promptVersionId ? { promptVersionId: pathId(input.promptVersionId, '프롬프트 버전 ID') } : {}),
    },
    { idempotencyKey: extras.idempotencyKey ?? createIdempotencyKey(), signal: extras.signal },
  )
}

/**
 * 이전 평가(baseline)와의 질문별 개선 · 악화 비교. 응답 구조가 명세에 정해져 있지 않아(자유 객체) 그대로 돌려줍니다.
 * 명세는 baselineEvaluationId를 선택이라고 하지만 실제 서버는 없으면 400 BASELINE_REQUIRED로 거절해서 필수로 받습니다.
 */
export function getEvaluationComparison(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  baselineEvaluationId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Record<string, unknown>>(`${evaluationPath(projectId, serviceId, evaluationId)}/comparison`, {
    query: { limit, cursor, baselineEvaluationId: pathId(baselineEvaluationId, '기준 평가 ID') },
    signal,
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
  const { signal, limit, cursor, criterion, resultStatus, issueKind, change } = query
  return api.get<Page<EvaluationItemSummary>>(`${evaluationPath(projectId, serviceId, evaluationId)}/items`, {
    query: { limit, cursor, criterion, resultStatus, issueKind, change },
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

/* ---------- 항목 사람 검토 ---------- */

const itemPath = (projectId: string, serviceId: string, evaluationId: string, itemId: string) =>
  `${evaluationPath(projectId, serviceId, evaluationId)}/items/${pathId(itemId, '평가 항목 ID')}`

/** 항목에 대한 사람의 판정 기록 목록 */
export function listItemReviews(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  itemId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Page<ItemReview>>(`${itemPath(projectId, serviceId, evaluationId, itemId)}/reviews`, {
    query: { limit, cursor },
    signal,
  })
}

/**
 * 항목의 조건 하나에 사람이 판정을 남깁니다. 항목의 reviewRevision을 expectedRevision으로 보내며,
 * 그 사이 다른 사람이 판정했으면 409로 거절됩니다.
 */
export function reviewItem(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  itemId: string,
  input: ItemReviewInput,
  extras: RequestExtras = {},
) {
  return api.post<ItemReview>(
    `${itemPath(projectId, serviceId, evaluationId, itemId)}/reviews`,
    {
      expectedRevision: input.expectedRevision,
      ...(input.side ? { side: input.side } : {}),
      conditionId: pathId(input.conditionId, '조건 ID'),
      verdict: input.verdict,
      reason: input.reason.trim(),
    },
    { signal: extras.signal },
  )
}

/** 대기 · 진행 중인 평가 중단. 이미 받은 결과는 남고, 이미 보낸 호출은 결과 불확실로 표시됩니다. */
export function cancelEvaluation(projectId: string, serviceId: string, evaluationId: string, extras: RequestExtras = {}) {
  return api.post<Evaluation>(`${evaluationPath(projectId, serviceId, evaluationId)}/cancel`, {}, { signal: extras.signal })
}

/** 중단한 평가에서 아직 호출하지 않은 문항만 이어서 실행. 연결 설정 revision이 실행 때와 같아야 합니다. */
export function resumeEvaluation(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  connectionRevision: number,
  extras: RequestExtras = {},
) {
  return api.post<Evaluation>(`${evaluationPath(projectId, serviceId, evaluationId)}/resume`, { connectionRevision }, { signal: extras.signal })
}

/** 채점 화면 칸(최대 200문항). 단일 평가만 됩니다(비교 평가는 409). */
export function getGradingBoard(projectId: string, serviceId: string, evaluationId: string, extras: RequestExtras = {}) {
  return api.get<GradingBoard>(`${evaluationPath(projectId, serviceId, evaluationId)}/grading`, { signal: extras.signal })
}

/** 항목의 답변 전체 O/X 판정 기록 목록 */
export function listAnswerReviews(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  itemId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Page<AnswerReview>>(`${itemPath(projectId, serviceId, evaluationId, itemId)}/answer-reviews`, {
    query: { limit, cursor },
    signal,
  })
}

/**
 * 항목의 답변 전체에 사람이 O/X 판정을 남깁니다. 조건별 판정(reviewItem)과 revision을 함께 쓰므로
 * 그 사이 누가 어느 쪽이든 판정했으면 409로 거절됩니다. 조건별 판정과 엇갈리면 서버가 검토 필요로 표시합니다.
 */
export function reviewAnswer(
  projectId: string,
  serviceId: string,
  evaluationId: string,
  itemId: string,
  input: AnswerReviewInput,
  extras: RequestExtras = {},
) {
  const reason = input.reason?.trim()
  return api.post<AnswerReview>(
    `${itemPath(projectId, serviceId, evaluationId, itemId)}/answer-reviews`,
    {
      expectedRevision: input.expectedRevision,
      ...(input.side ? { side: input.side } : {}),
      verdict: input.verdict,
      ...(reason ? { reason } : {}),
    },
    { signal: extras.signal },
  )
}
