import { api, pathId, type Page, type PageQuery, type RequestExtras, type Schema } from '../../lib/api'
import { servicePath } from '../service/api'

/** 서비스(챗봇)가 쓰는 시스템 프롬프트. 한 번 만든 버전은 고칠 수 없고, 고치면 새 버전이 생깁니다. */
export type Prompt = Schema<'PromptResponse'>
export type PromptSummary = Schema<'PromptSummary'>
export type PromptVersion = Schema<'PromptVersionResponse'>
export type PromptVersionSummary = Schema<'PromptVersionSummary'>

type PromptMeta = {
  /** 버전 이름표 (예: "v2 톤 수정") */
  label?: string | null
  /** 무엇을 왜 바꿨는지 */
  changeNote?: string | null
  /** 챗봇 쪽에서 쓰는 버전 식별자 (예: 배포 태그) */
  externalVersionRef?: string | null
}
export type PromptCreateInput = PromptMeta & { name: string; content: string }
export type PromptVersionCreateInput = PromptMeta & {
  content: string
  /** 수정 제안을 적용해 만드는 버전이면 그 제안과 선택 revision (content는 제안의 previewContent 그대로) */
  suggestionId?: string
  suggestionRevision?: number
  /** 어느 버전을 고쳐서 만드는지. 그 사이 다른 버전이 생겼으면 서버가 충돌로 거절합니다. */
  baseVersionId: string
}

export const PROMPT_RULES = {
  nameMax: 100,
  contentMax: 100_000,
  labelMax: 100,
  changeNoteMax: 2000,
  externalVersionRefMax: 200,
} as const

const promptsPath = (projectId: string, serviceId: string) => `${servicePath(projectId, serviceId)}/prompts`
const promptPath = (projectId: string, serviceId: string, promptId: string) =>
  `${promptsPath(projectId, serviceId)}/${pathId(promptId, '프롬프트 ID')}`
const versionsPath = (projectId: string, serviceId: string, promptId: string) =>
  `${promptPath(projectId, serviceId, promptId)}/versions`

/** 비어 있는 선택 값은 보내지 않고, 앞뒤 공백은 지웁니다 */
function optionalMeta(meta: PromptMeta) {
  const out: PromptMeta = {}
  for (const key of ['label', 'changeNote', 'externalVersionRef'] as const) {
    const value = meta[key]?.trim()
    if (value) out[key] = value
  }
  return out
}

/** 프롬프트와 첫 버전을 함께 만듭니다. 프롬프트 본문은 사용자가 쓴 그대로 보냅니다(공백도 의미가 있을 수 있음). */
export function createPrompt(projectId: string, serviceId: string, input: PromptCreateInput, extras: RequestExtras = {}) {
  return api.post<Prompt>(
    promptsPath(projectId, serviceId),
    { name: input.name.trim(), content: input.content, ...optionalMeta(input) },
    { signal: extras.signal },
  )
}

export function listPrompts(projectId: string, serviceId: string, query: PageQuery & RequestExtras = {}) {
  const { signal, limit, cursor } = query
  return api.get<Page<PromptSummary>>(promptsPath(projectId, serviceId), { query: { limit, cursor }, signal })
}

/** 프롬프트와 현재(가장 최신) 버전 */
export function getPrompt(projectId: string, serviceId: string, promptId: string, extras: RequestExtras = {}) {
  return api.get<Prompt>(promptPath(projectId, serviceId, promptId), { signal: extras.signal })
}

/** 새 버전 만들기. 기존 버전은 그대로 남습니다. */
export function createPromptVersion(
  projectId: string,
  serviceId: string,
  promptId: string,
  input: PromptVersionCreateInput,
  extras: RequestExtras = {},
) {
  return api.post<PromptVersion>(
    versionsPath(projectId, serviceId, promptId),
    {
      content: input.content,
      baseVersionId: pathId(input.baseVersionId, '기준 버전 ID'),
      ...optionalMeta(input),
      ...(input.suggestionId ? { suggestionId: input.suggestionId, suggestionRevision: input.suggestionRevision } : {}),
    },
    { signal: extras.signal },
  )
}

export function listPromptVersions(
  projectId: string,
  serviceId: string,
  promptId: string,
  query: PageQuery & RequestExtras = {},
) {
  const { signal, limit, cursor } = query
  return api.get<Page<PromptVersionSummary>>(versionsPath(projectId, serviceId, promptId), {
    query: { limit, cursor },
    signal,
  })
}

export function getPromptVersion(
  projectId: string,
  serviceId: string,
  promptId: string,
  versionId: string,
  extras: RequestExtras = {},
) {
  return api.get<PromptVersion>(
    `${versionsPath(projectId, serviceId, promptId)}/${pathId(versionId, '프롬프트 버전 ID')}`,
    { signal: extras.signal },
  )
}
