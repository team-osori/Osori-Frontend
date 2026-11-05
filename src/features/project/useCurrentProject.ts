import { useMemo } from 'react'
import { isApiError, useApiQuery } from '../../lib/api'
import type { CurrentProjectSummary } from '../../components/common'
import { getConnection } from '../connection/connectionApi'
import { listPrompts } from '../prompt/api'
import { getProjectService } from '../service/api'
import { getProject } from './api'

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/**
 * 사이드바에 보이는 지금 프로젝트 요약(이름 · 서비스 주소 · 최신 프롬프트 · 시험지 · 열린 단계).
 * App이 한 번 불러 ProjectNavContext로 내려주므로 평가 화면마다 따로 요청하지 않습니다.
 * 연결 설정 · 프롬프트가 없거나 못 불러와도 요약 전체를 실패로 보지 않고 그 칸만 비웁니다.
 */
export function useCurrentProject(projectId: string | null, enabled: boolean): CurrentProjectSummary | undefined {
  const query = useApiQuery(
    async (signal) => {
      if (!projectId || !enabled) return null
      const [project, service] = await Promise.all([getProject(projectId, { signal }), getProjectService(projectId, { signal })])
      const [connection, prompts] = service
        ? await Promise.all([
            getConnection(projectId, service.id, { signal }).catch((error) => {
              if (isApiError(error) && error.status === 404) return null
              throw error
            }),
            listPrompts(projectId, service.id, { limit: 1, signal }),
          ])
        : [null, null]
      return { project, service, connection, prompt: prompts?.items[0] ?? null }
    },
    [projectId, enabled],
  )

  const { data, reload } = query
  return useMemo(() => {
    if (!data || data.project.id !== projectId) return undefined
    const testSet = data.project.progress?.testSet
    return {
      id: data.project.id,
      name: data.project.name,
      host: data.connection ? hostOf(data.connection.url) : undefined,
      promptLabel: data.prompt ? `v${data.prompt.version}` : undefined,
      questionSet: testSet ? `${testSet.label} · ${testSet.questionCount}문항${testSet.status === 'draft' ? ' (검토 중)' : ''}` : '없음',
      unlockedStage: data.project.progress?.unlockedStage ?? 1,
      reload,
    }
  }, [data, projectId, reload])
}
