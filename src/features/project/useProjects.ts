import { useCallback } from 'react'
import { usePagedList } from '../../lib/api'
import { createProject, listProjects, PROJECT_PAGE_SIZE, type ProjectCreateInput, type ProjectResponse } from './api'

/**
 * 내 프로젝트 목록. 커서 페이지네이션으로 이어 붙이고, 만들기까지 한곳에서 관리합니다.
 *
 * const { items, hasMore, loadMore, create, reload } = useProjects()
 */
export function useProjects({ pageSize = PROJECT_PAGE_SIZE, enabled = true }: { pageSize?: number; enabled?: boolean } = {}) {
  const list = usePagedList<ProjectResponse>({
    fetchPage: ({ cursor, signal }) => listProjects({ limit: pageSize, cursor, signal }),
    getKey: (project) => project.id,
    // 로그인하면 다시 불러오고, 로그아웃 상태에서는 요청하지 않음(401로 세션 만료 처리가 되지 않게)
    deps: [pageSize, enabled],
    enabled,
  })

  /** 만든 프로젝트를 목록 맨 앞에 바로 추가하고 돌려줌. 실패하면 오류를 던짐(호출한 쪽에서 화면에 표시) */
  const { prepend } = list
  const create = useCallback(
    async (input: ProjectCreateInput) => {
      const created = await createProject(input)
      prepend(created)
      return created
    },
    [prepend],
  )

  return {
    items: list.items,
    loading: list.loading,
    loadingMore: list.loadingMore,
    error: list.error,
    hasMore: list.hasMore,
    unauthorized: list.unauthorized,
    loadMore: list.loadMore,
    create,
    reload: list.reload,
  }
}
