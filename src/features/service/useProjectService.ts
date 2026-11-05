import { useCallback } from 'react'
import { useApiQuery } from '../../lib/api'
import { createService, getProjectService, type ServiceCreateInput, type ServiceResponse } from './api'

/**
 * 프로젝트에 연결된 서비스(챗봇) 하나. 프로젝트마다 최대 하나라서 목록이 아니라 단건으로 다룹니다.
 * 서비스가 아직 없으면 service가 null이고, create로 등록하면 바로 채워집니다.
 *
 * const { service, loading, create } = useProjectService(projectId)
 */
export function useProjectService(projectId: string | undefined) {
  const query = useApiQuery<ServiceResponse | null>(
    (signal) => (projectId ? getProjectService(projectId, { signal }) : Promise.resolve(null)),
    [projectId],
  )
  const { setData } = query

  /** 등록하고 바로 화면에 반영. 실패하면 오류를 던집니다(이미 있으면 409). */
  const create = useCallback(
    async (input: ServiceCreateInput) => {
      if (!projectId) throw new RangeError('프로젝트가 선택되지 않았습니다.')
      const created = await createService(projectId, input)
      setData(created)
      return created
    },
    [projectId, setData],
  )

  return {
    service: query.data,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    create,
  }
}
