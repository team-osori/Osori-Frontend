import { api, pathId, revisionTag, type Page, type PageQuery, type RequestExtras, type Schema } from '../../lib/api'

/** 프로젝트의 정책 문서. 본문과 그 안의 평가 규칙(rules)은 버전으로 관리하며, 한 번 만든 버전은 고칠 수 없습니다. */
export type Policy = Schema<'PolicyOut'>
export type PolicyVersion = Schema<'PolicyVersionOut'>
/** 정책과 최신 버전을 함께 돌려주는 응답 */
export type PolicyDetail = Schema<'PolicyDetail'>
/** 정책 본문에서 뽑은 평가 규칙 하나. sourceQuote는 근거가 되는 원문 문장입니다. */
export type PolicyRule = Schema<'Rule'>

export type PolicyCreateInput = { name: string; content: string; rules: PolicyRule[] }
export type PolicyVersionCreateInput = {
  content: string
  rules: PolicyRule[]
  /** 지금 화면이 알고 있는 정책의 revision. 그 사이 다른 사람이 고쳤으면 서버가 충돌로 거절합니다. */
  expectedRevision: number
}

export const POLICY_RULES = {
  nameMax: 100,
  contentMax: 100_000,
  rulesMin: 1,
  rulesMax: 100,
  ruleKeyMax: 100,
  ruleKeyPattern: /^[A-Za-z0-9_-]+$/,
  ruleDescriptionMax: 2000,
  ruleSourceQuoteMax: 10_000,
} as const

const policiesPath = (projectId: string) => `/api/projects/${pathId(projectId, '프로젝트 ID')}/policies`
const policyPath = (projectId: string, policyId: string) =>
  `${policiesPath(projectId)}/${pathId(policyId, '정책 ID')}`

export function createPolicy(projectId: string, input: PolicyCreateInput, extras: RequestExtras = {}) {
  return api.post<PolicyDetail>(
    policiesPath(projectId),
    { name: input.name.trim(), content: input.content, rules: input.rules },
    { signal: extras.signal },
  )
}

export function listPolicies(projectId: string, query: PageQuery & RequestExtras = {}) {
  const { signal, limit, cursor } = query
  return api.get<Page<Policy>>(policiesPath(projectId), { query: { limit, cursor }, signal })
}

export function getPolicy(projectId: string, policyId: string, extras: RequestExtras = {}) {
  return api.get<PolicyDetail>(policyPath(projectId, policyId), { signal: extras.signal })
}

/** 정책 삭제. 마지막으로 본 revision을 If-Match로 보내, 그 사이 바뀐 정책을 지우지 않게 합니다. */
export function deletePolicy(projectId: string, policyId: string, revision: number, extras: RequestExtras = {}) {
  return api.delete(policyPath(projectId, policyId), { ifMatch: revisionTag(revision), signal: extras.signal })
}

export function createPolicyVersion(
  projectId: string,
  policyId: string,
  input: PolicyVersionCreateInput,
  extras: RequestExtras = {},
) {
  return api.post<PolicyVersion>(
    `${policyPath(projectId, policyId)}/versions`,
    { content: input.content, rules: input.rules, expectedRevision: input.expectedRevision },
    { signal: extras.signal },
  )
}

export function listPolicyVersions(
  projectId: string,
  policyId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Page<PolicyVersion>>(`${policyPath(projectId, policyId)}/versions`, {
    query: { limit, cursor },
    signal,
  })
}

export function getPolicyVersion(projectId: string, policyId: string, versionId: string, extras: RequestExtras = {}) {
  return api.get<PolicyVersion>(
    `${policyPath(projectId, policyId)}/versions/${pathId(versionId, '정책 버전 ID')}`,
    { signal: extras.signal },
  )
}
