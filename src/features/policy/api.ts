import { api, pathId, revisionTag, type Page, type PageQuery, type RequestExtras, type Schema } from '../../lib/api'

/** 프로젝트의 정책 문서. 본문과 그 안의 평가 규칙(rules)은 버전으로 관리하며, 한 번 만든 버전은 고칠 수 없습니다. */
export type Policy = Schema<'PolicyOut'>
export type PolicyVersion = Schema<'PolicyVersionOut'>
/** 정책과 최신 버전을 함께 돌려주는 응답 */
export type PolicyDetail = Schema<'PolicyDetail'>
/** 정책 본문에서 뽑은 평가 규칙 하나. sourceQuote는 근거가 되는 원문 문장입니다. */
export type PolicyRule = Schema<'Rule'>
/** 파일에서 뽑은 정책 초안. 아직 저장되지 않았고, createPolicy로 보내야 저장됩니다. */
export type PolicyDraft = Schema<'PolicyDraft'>

export type PolicyCreateInput = {
  name: string
  content: string
  rules: PolicyRule[]
  /** 파일에서 가져온 정책이면 원본 파일 · 청크 위치 정보 (근거를 문서 위치로 보여줄 때 씀) */
  sourceDocument?: PolicyDraft['sourceDocument']
}
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
  /** 업로드 파일 최대 크기 (10MiB) */
  fileMaxBytes: 10 * 1024 * 1024,
  /** 업로드할 수 있는 파일 형식 */
  fileAccept: '.pdf,.docx,.txt,.md',
} as const

const policiesPath = (projectId: string) => `/api/projects/${pathId(projectId, '프로젝트 ID')}/policies`
const policyPath = (projectId: string, policyId: string) =>
  `${policiesPath(projectId)}/${pathId(policyId, '정책 ID')}`

export function createPolicy(projectId: string, input: PolicyCreateInput, extras: RequestExtras = {}) {
  return api.post<PolicyDetail>(
    policiesPath(projectId),
    { name: input.name.trim(), content: input.content, rules: input.rules, ...(input.sourceDocument ? { sourceDocument: input.sourceDocument } : {}) },
    { signal: extras.signal },
  )
}

/**
 * 정책 파일(PDF · DOCX · TXT · MD, 10MiB 이하)에서 본문과 규칙 초안을 뽑습니다. 이 요청만으로는 저장되지 않습니다.
 * 파일 하나씩 보내는 /import를 씁니다(여러 파일을 한 번에 받는 /imports도 있음).
 */
export function importPolicyFile(projectId: string, file: File, name: string, extras: RequestExtras = {}) {
  const form = new FormData()
  form.append('file', file)
  form.append('name', name.trim())
  return api.post<PolicyDraft>(`${policiesPath(projectId)}/import`, form, { signal: extras.signal })
}

/** 파일 이름에서 확장자를 뺀 정책 이름 (서버 최대 100자) */
export function policyNameOf(file: File) {
  return file.name.replace(/\.[^.]+$/, '').trim().slice(0, POLICY_RULES.nameMax) || '정책 문서'
}

/** 파일을 올려 초안을 받고 그대로 정책으로 저장합니다. 규칙을 하나도 못 뽑았으면 서버가 저장을 거절합니다. */
export async function uploadPolicyFile(projectId: string, file: File, extras: RequestExtras = {}) {
  const draft = await importPolicyFile(projectId, file, policyNameOf(file), extras)
  return createPolicy(
    projectId,
    { name: draft.name, content: draft.content, rules: draft.rules, sourceDocument: draft.sourceDocument },
    extras,
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
