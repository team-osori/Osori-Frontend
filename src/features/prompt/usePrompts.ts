import { useCallback } from 'react'
import { usePagedList } from '../../lib/api'
import {
  createPrompt,
  createPromptVersion,
  listPromptVersions,
  listPrompts,
  type Prompt,
  type PromptCreateInput,
  type PromptSummary,
  type PromptVersion,
  type PromptVersionCreateInput,
  type PromptVersionSummary,
} from './api'

const PAGE_SIZE = 20

/** 서비스의 프롬프트 목록. 만든 프롬프트는 목록 맨 앞에 바로 들어갑니다. */
export function usePrompts(projectId: string | undefined, serviceId: string | undefined) {
  const list = usePagedList<PromptSummary>({
    fetchPage: ({ cursor, signal }) => listPrompts(projectId!, serviceId!, { limit: PAGE_SIZE, cursor, signal }),
    getKey: (prompt) => prompt.id,
    deps: [projectId, serviceId],
    enabled: Boolean(projectId && serviceId),
  })
  const { prepend } = list

  const create = useCallback(
    async (input: PromptCreateInput): Promise<Prompt> => {
      if (!projectId || !serviceId) throw new RangeError('프로젝트와 서비스가 선택되지 않았습니다.')
      const created = await createPrompt(projectId, serviceId, input)
      // 목록은 요약만 담으므로 상세 응답에서 요약을 만들어 넣음
      prepend({
        id: created.id,
        name: created.name,
        currentVersionId: created.currentVersionId,
        version: created.currentVersion.version,
        revision: created.revision,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      })
      return created
    },
    [projectId, serviceId, prepend],
  )

  return { ...list, create }
}

/** 프롬프트의 버전 목록. 새 버전은 기준 버전(baseVersionId)을 지정해서 만듭니다. */
export function usePromptVersions(
  projectId: string | undefined,
  serviceId: string | undefined,
  promptId: string | undefined,
) {
  const list = usePagedList<PromptVersionSummary>({
    fetchPage: ({ cursor, signal }) =>
      listPromptVersions(projectId!, serviceId!, promptId!, { limit: PAGE_SIZE, cursor, signal }),
    getKey: (version) => version.id,
    deps: [projectId, serviceId, promptId],
    enabled: Boolean(projectId && serviceId && promptId),
  })
  const { reload } = list

  const createVersion = useCallback(
    async (input: PromptVersionCreateInput): Promise<PromptVersion> => {
      if (!projectId || !serviceId || !promptId) throw new RangeError('프롬프트가 선택되지 않았습니다.')
      const created = await createPromptVersion(projectId, serviceId, promptId, input)
      // 정렬 순서는 서버가 정하므로 임의로 끼워 넣지 않고 다시 불러옴
      reload()
      return created
    },
    [projectId, serviceId, promptId, reload],
  )

  return { ...list, createVersion }
}
