import {
  api,
  createIdempotencyKey,
  pathId,
  type Page,
  type PageQuery,
  type RequestExtras,
  type Schema,
} from '../../lib/api'

/* 이 파일은 서비스 백엔드의 "테스트셋(질문 세트)" API입니다.
 * (같은 폴더의 api.ts는 화면 목업용 임시 함수라서 이름을 구분했습니다.)
 *
 * 테스트셋은 버전으로 관리합니다. 질문을 고치는 것은 draft 버전에서만 가능하고,
 * 확정(confirm)한 버전은 고칠 수 없어서 고치려면 새 draft 버전을 만듭니다.
 *
 * 질문을 추가 · 수정 · 검토 · 확정 · 생성하는 요청은 모두 "버전의 revision"을 expectedRevision으로 보냅니다.
 * 그 사이 다른 사람이 버전을 바꿨으면 서버가 409/412로 거절하고, 성공하면 새 revision이 든 버전 전체를 돌려줍니다.
 * 그래서 연이어 요청할 때는 직전 응답의 revision을 다음 요청에 써야 합니다. */

export type TestSet = Schema<'TestSetOut'>
/** 테스트셋과 그 최신 버전 */
export type TestSetDetail = Schema<'TestSetDetail'>
export type TestSetVersion = Schema<'TestSetVersionOut'>
export type TestSetVersionSummary = Schema<'TestSetVersionSummary'>
export type TestQuestion = Schema<'QuestionOut'>
/** 질문 유형: normal · exception · boundary(경계) · ambiguous */
export type QuestionCategory = NonNullable<Schema<'QuestionWrite'>['category']>
/** 질문에 붙는 세부 판정 조건. 평가 기준(retrieval · grounding · response · policy) 하나에 연결되고, 꼭 해야 하는 일(required)이거나 하면 안 되는 일(forbidden)입니다. */
export type ExpectedCondition = Schema<'ExpectedCondition'>
/** 질문이 만들어지고 고쳐지고 검토된 기록 한 건 */
export type QuestionHistory = Schema<'QuestionHistoryOut'>
export type QuestionHistoryAction = QuestionHistory['action']
export type QuestionReviewStatus = TestQuestion['reviewStatus']
/** 질문 한 건의 내용. 수정(PATCH)도 일부 항목이 아니라 전체 값을 보냅니다. */
export type QuestionInput = Omit<Schema<'QuestionWrite'>, 'expectedRevision'>
export type ReviewDecision = Schema<'Review'>['status']
/** 확정된 버전을 평가에 그대로 쓰기 위해 묶어 둔 스냅샷 */
export type EvaluationSnapshot = Schema<'EvaluationSnapshot'>

export type TestSetCreateInput = { name: string; policyVersionIds: string[] }
export type NewDraftInput = {
  /** 새 draft를 만들 테스트셋의 현재 revision */
  expectedRevision: number
  /** 어느 버전을 바탕으로 복사할지 */
  sourceVersionId: string
  /** 생략하면 바탕 버전의 정책 버전을 그대로 씁니다 */
  policyVersionIds?: string[]
}

export const TESTSET_RULES = {
  nameMax: 100,
  policyVersionsMin: 1,
  policyVersionsMax: 20,
  questionMax: 2000,
  expectedBehaviorMax: 2000,
  forbiddenBehaviorsMax: 20,
  forbiddenBehaviorMax: 2000,
  ruleKeysMax: 100,
  evidenceQuoteMax: 10_000,
  reviewNoteMax: 2000,
  changeNoteMax: 2000,
  expectedConditionsMax: 30,
  expectedConditionDescriptionMax: 2000,
  /** 한 번에 만들 수 있는 질문 수 */
  generateCount: { min: 1, max: 50, default: 10 },
  /** 질문 생성 때 고를 수 있는 유형 (생략하면 서버가 정함) */
  categories: ['normal', 'exception', 'boundary', 'ambiguous'] as const satisfies readonly QuestionCategory[],
} as const

const testSetsPath = (projectId: string) => `/api/projects/${pathId(projectId, '프로젝트 ID')}/testsets`
const testSetPath = (projectId: string, testSetId: string) =>
  `${testSetsPath(projectId)}/${pathId(testSetId, '테스트셋 ID')}`
const versionsPath = (projectId: string, testSetId: string) => `${testSetPath(projectId, testSetId)}/versions`
const versionPath = (projectId: string, testSetId: string, versionId: string) =>
  `${versionsPath(projectId, testSetId)}/${pathId(versionId, '테스트셋 버전 ID')}`
const questionsPath = (projectId: string, testSetId: string, versionId: string) =>
  `${versionPath(projectId, testSetId, versionId)}/questions`
const questionPath = (projectId: string, testSetId: string, versionId: string, questionId: string) =>
  `${questionsPath(projectId, testSetId, versionId)}/${pathId(questionId, '질문 ID')}`

/* ---------- 테스트셋 ---------- */

/** 정책 버전들을 바탕으로 테스트셋과 첫 draft 버전을 만듭니다. */
export function createTestSet(projectId: string, input: TestSetCreateInput, extras: RequestExtras = {}) {
  return api.post<TestSetDetail>(
    testSetsPath(projectId),
    {
      name: input.name.trim(),
      policyVersionIds: input.policyVersionIds.map((id) => pathId(id, '정책 버전 ID')),
    },
    { signal: extras.signal },
  )
}

export function listTestSets(projectId: string, query: PageQuery & RequestExtras = {}) {
  const { signal, limit, cursor } = query
  return api.get<Page<TestSet>>(testSetsPath(projectId), { query: { limit, cursor }, signal })
}

export function getTestSet(projectId: string, testSetId: string, extras: RequestExtras = {}) {
  return api.get<TestSetDetail>(testSetPath(projectId, testSetId), { signal: extras.signal })
}

/* ---------- 테스트셋 버전 ---------- */

export function listTestSetVersions(
  projectId: string,
  testSetId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Page<TestSetVersionSummary>>(versionsPath(projectId, testSetId), {
    query: { limit, cursor },
    signal,
  })
}

/** 질문이 든 버전 전체 */
export function getTestSetVersion(
  projectId: string,
  testSetId: string,
  versionId: string,
  extras: RequestExtras = {},
) {
  return api.get<TestSetVersion>(versionPath(projectId, testSetId, versionId), { signal: extras.signal })
}

/** 기존 버전을 복사해 새 draft 버전을 만듭니다. 확정된 버전을 고치고 싶을 때 씁니다. */
export function createTestSetDraft(
  projectId: string,
  testSetId: string,
  input: NewDraftInput,
  extras: RequestExtras = {},
) {
  return api.post<TestSetVersion>(
    versionsPath(projectId, testSetId),
    {
      expectedRevision: input.expectedRevision,
      sourceVersionId: pathId(input.sourceVersionId, '바탕 버전 ID'),
      ...(input.policyVersionIds
        ? { policyVersionIds: input.policyVersionIds.map((id) => pathId(id, '정책 버전 ID')) }
        : {}),
    },
    { signal: extras.signal },
  )
}

/* ---------- 질문 (draft 버전에서만) ---------- */

/** 질문 추가. 응답은 질문이 늘어난 버전 전체이며, 새 질문의 ID는 questions 안에서 찾아야 합니다. */
export function addQuestion(
  projectId: string,
  testSetId: string,
  versionId: string,
  input: QuestionInput,
  expectedRevision: number,
  extras: RequestExtras = {},
) {
  return api.post<TestSetVersion>(
    questionsPath(projectId, testSetId, versionId),
    { ...input, expectedRevision },
    { signal: extras.signal },
  )
}

export function getQuestion(
  projectId: string,
  testSetId: string,
  versionId: string,
  questionId: string,
  extras: RequestExtras = {},
) {
  return api.get<TestQuestion>(questionPath(projectId, testSetId, versionId, questionId), { signal: extras.signal })
}

/** 질문 수정. 일부만이 아니라 질문의 모든 항목을 보냅니다. */
export function editQuestion(
  projectId: string,
  testSetId: string,
  versionId: string,
  questionId: string,
  input: QuestionInput,
  expectedRevision: number,
  extras: RequestExtras = {},
) {
  return api.patch<TestSetVersion>(
    questionPath(projectId, testSetId, versionId, questionId),
    { ...input, expectedRevision },
    { signal: extras.signal },
  )
}

/**
 * 질문 삭제. 응답 본문이 없으므로, 새 revision이 필요하면 getTestSetVersion으로 다시 불러와야 합니다.
 * 버전의 현재 revision을 If-Match로 보냅니다.
 */
export function deleteQuestion(
  projectId: string,
  testSetId: string,
  versionId: string,
  questionId: string,
  revision: number,
  extras: RequestExtras = {},
) {
  return api.delete(questionPath(projectId, testSetId, versionId, questionId), {
    ifMatch: revision,
    signal: extras.signal,
  })
}

/** 질문을 승인(approved) 또는 반려(rejected)합니다. 메모는 선택. */
export function reviewQuestion(
  projectId: string,
  testSetId: string,
  versionId: string,
  questionId: string,
  decision: ReviewDecision,
  expectedRevision: number,
  note?: string | null,
  extras: RequestExtras = {},
) {
  const trimmed = note?.trim()
  return api.post<TestSetVersion>(
    `${questionPath(projectId, testSetId, versionId, questionId)}/review`,
    { status: decision, expectedRevision, ...(trimmed ? { note: trimmed } : {}) },
    { signal: extras.signal },
  )
}

/**
 * 질문 자동 생성. count(1~50, 기본 10)만큼 만들어 draft 버전에 넣고 버전 전체를 돌려줍니다.
 * 같은 요청이 질문을 두 번 만들지 않도록 Idempotency-Key를 붙입니다.
 * 네트워크가 끊겨 다시 시도할 때는 같은 키를 넘겨야 서버가 중복으로 알아봅니다.
 */
export function generateQuestions(
  projectId: string,
  testSetId: string,
  versionId: string,
  input: {
    expectedRevision: number
    count?: number
    /** 만들 질문 유형. 1~4개를 고르고, 생략하면 서버가 정합니다. */
    categories?: QuestionCategory[]
  },
  extras: RequestExtras & { idempotencyKey?: string } = {},
) {
  return api.post<TestSetVersion>(
    `${questionsPath(projectId, testSetId, versionId)}/generate`,
    {
      expectedRevision: input.expectedRevision,
      ...(input.count !== undefined ? { count: input.count } : {}),
      // 빈 배열은 서버가 거절하므로(1개 이상) 고르지 않은 것으로 보고 보내지 않음
      ...(input.categories?.length ? { categories: input.categories } : {}),
    },
    { idempotencyKey: extras.idempotencyKey ?? createIdempotencyKey(), signal: extras.signal },
  )
}

/* ---------- 확정 · 스냅샷 ---------- */

/** draft 버전을 확정합니다. 확정하면 더는 질문을 고칠 수 없습니다. */
export function confirmTestSetVersion(
  projectId: string,
  testSetId: string,
  versionId: string,
  expectedRevision: number,
  extras: RequestExtras = {},
) {
  return api.post<TestSetVersion>(
    `${versionPath(projectId, testSetId, versionId)}/confirm`,
    { expectedRevision },
    { signal: extras.signal },
  )
}

/** 확정된 버전을 평가에 쓰는 형태(정책 본문 + 질문)로 묶은 것. */
export function getEvaluationSnapshot(
  projectId: string,
  testSetId: string,
  versionId: string,
  extras: RequestExtras = {},
) {
  return api.get<EvaluationSnapshot>(`${versionPath(projectId, testSetId, versionId)}/evaluation-snapshot`, {
    signal: extras.signal,
  })
}

/* ---------- 이력 ---------- */

/**
 * 버전 전체의 변경 이력(지워진 질문 포함). 추가만 되는 기록이라 지운 질문의 흔적도 남습니다.
 * 각 기록의 before/after는 서버가 정한 자유 형식 객체입니다.
 */
export function listTestSetVersionHistory(
  projectId: string,
  testSetId: string,
  versionId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Page<QuestionHistory>>(`${versionPath(projectId, testSetId, versionId)}/history`, {
    query: { limit, cursor },
    signal,
  })
}

/** 질문 하나의 변경 이력 */
export function listQuestionHistory(
  projectId: string,
  testSetId: string,
  versionId: string,
  questionId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Page<QuestionHistory>>(`${questionPath(projectId, testSetId, versionId, questionId)}/history`, {
    query: { limit, cursor },
    signal,
  })
}
