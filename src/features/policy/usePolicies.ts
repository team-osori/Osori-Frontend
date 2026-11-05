import { useCallback } from 'react'
import { usePagedList } from '../../lib/api'
import {
  createPolicy,
  createPolicyVersion,
  deletePolicy,
  listPolicies,
  listPolicyVersions,
  type Policy,
  type PolicyCreateInput,
  type PolicyDetail,
  type PolicyVersion,
  type PolicyVersionCreateInput,
} from './api'

const PAGE_SIZE = 20

/** 프로젝트의 정책 목록. 만들기 · 삭제를 목록에 바로 반영합니다. */
export function usePolicies(projectId: string | undefined) {
  const list = usePagedList<Policy>({
    fetchPage: ({ cursor, signal }) => listPolicies(projectId!, { limit: PAGE_SIZE, cursor, signal }),
    getKey: (policy) => policy.id,
    deps: [projectId],
    enabled: Boolean(projectId),
  })
  const { prepend, remove } = list

  const create = useCallback(
    async (input: PolicyCreateInput): Promise<PolicyDetail> => {
      if (!projectId) throw new RangeError('프로젝트가 선택되지 않았습니다.')
      const created = await createPolicy(projectId, input)
      prepend(created.policy)
      return created
    },
    [projectId, prepend],
  )

  /** 삭제. 목록에 있는 정책의 revision을 If-Match로 보내므로, 그 사이 바뀐 정책이면 409/412 오류를 던집니다. */
  const destroy = useCallback(
    async (policy: Pick<Policy, 'id' | 'revision'>) => {
      if (!projectId) throw new RangeError('프로젝트가 선택되지 않았습니다.')
      await deletePolicy(projectId, policy.id, policy.revision)
      remove(policy.id)
    },
    [projectId, remove],
  )

  return { ...list, create, destroy }
}

/** 정책의 버전 목록. 새 버전을 만들면 정책의 revision이 올라갑니다. */
export function usePolicyVersions(projectId: string | undefined, policyId: string | undefined) {
  const list = usePagedList<PolicyVersion>({
    fetchPage: ({ cursor, signal }) => listPolicyVersions(projectId!, policyId!, { limit: PAGE_SIZE, cursor, signal }),
    getKey: (version) => version.id,
    deps: [projectId, policyId],
    enabled: Boolean(projectId && policyId),
  })
  const { reload } = list

  const createVersion = useCallback(
    async (input: PolicyVersionCreateInput): Promise<PolicyVersion> => {
      if (!projectId || !policyId) throw new RangeError('정책이 선택되지 않았습니다.')
      const created = await createPolicyVersion(projectId, policyId, input)
      reload()
      return created
    },
    [projectId, policyId, reload],
  )

  return { ...list, createVersion }
}
