import { api, pathId, type Page, type RequestExtras, type Schema } from '../../lib/api'

/** 평가할 챗봇(서비스). 프로젝트 하나에 서비스는 0~1개입니다. */
export type ServiceResponse = Schema<'ChatbotResponse'>
export type ServiceCreateInput = { name: string; description?: string | null }

export const SERVICE_RULES = { nameMax: 50, descriptionMax: 2000 } as const

const servicesPath = (projectId: string) => `/api/projects/${pathId(projectId, '프로젝트 ID')}/services`
export const servicePath = (projectId: string, serviceId: string) =>
  `${servicesPath(projectId)}/${pathId(serviceId, '서비스 ID')}`

/** 서비스 등록. 이미 있으면 서버가 409로 거절합니다(프로젝트당 하나). */
export function createService(projectId: string, input: ServiceCreateInput, extras: RequestExtras = {}) {
  const name = input.name.trim()
  const description = input.description?.trim()
  return api.post<ServiceResponse>(
    servicesPath(projectId),
    { name, ...(description ? { description } : {}) },
    { signal: extras.signal },
  )
}

/** 명세상 이 목록은 limit/cursor를 받지 않습니다(프로젝트당 서비스가 최대 하나라서). */
export function listServices(projectId: string, extras: RequestExtras = {}) {
  return api.get<Page<ServiceResponse>>(servicesPath(projectId), { signal: extras.signal })
}

export function getService(projectId: string, serviceId: string, extras: RequestExtras = {}) {
  return api.get<ServiceResponse>(servicePath(projectId, serviceId), { signal: extras.signal })
}

/** 서비스 이름 · 설명 수정. expectedRevision은 서비스 자체의 revision입니다. */
export function updateService(
  projectId: string,
  serviceId: string,
  revision: number,
  input: { name?: string; description?: string | null },
  extras: RequestExtras = {},
) {
  const body: Record<string, unknown> = { expectedRevision: revision }
  if (input.name !== undefined) body.name = input.name.trim()
  if (input.description !== undefined) body.description = input.description?.trim() || null
  return api.patch<ServiceResponse>(servicePath(projectId, serviceId), body, { signal: extras.signal })
}

/** 프로젝트에 연결된 서비스 하나. 아직 등록하지 않았으면 null */
export async function getProjectService(projectId: string, extras: RequestExtras = {}): Promise<ServiceResponse | null> {
  const page = await listServices(projectId, extras)
  return page.items[0] ?? null
}
