import { useMemo } from 'react'
import { fetchAllPages, useApiQuery } from '../../lib/api'
import { getPolicy, listPolicies, listPolicyVersions, type PolicyVersion } from '../policy/api'
import { evidenceKey } from './questionView'
import type { EvidenceOption } from './types'

/** 정책 문서 하나와 그 최신 버전 */
export type PolicySource = { policyId: string; name: string; latestVersionId: string }

type Loaded = {
  sources: PolicySource[]
  /** 정책 버전 ID → (정책 이름, 버전) */
  versions: Map<string, { name: string; version: PolicyVersion }>
}

/**
 * 프로젝트의 정책 문서와, 시험지가 쓰는 정책 버전들의 규칙을 불러옵니다.
 * 규칙은 질문의 근거로 연결할 수 있는 선택지(EvidenceOption)가 됩니다.
 *
 * 시험지는 만들 때의 정책 버전을 계속 쓰므로, 그 사이 문서가 새 버전이 됐으면 예전 버전을 따로 찾아옵니다.
 */
export function usePolicySources(projectId: string | undefined, usedVersionIds: string[]) {
  const key = usedVersionIds.join(',')
  const query = useApiQuery<Loaded>(
    async (signal) => {
      if (!projectId) return { sources: [], versions: new Map() }
      const policies = await fetchAllPages((q) => listPolicies(projectId, { limit: 100, ...q }), signal)
      const details = await Promise.all(policies.map((p) => getPolicy(projectId, p.id, { signal })))
      const versions = new Map(details.map((d) => [d.version.id, { name: d.policy.name, version: d.version }]))

      const missing = usedVersionIds.filter((id) => !versions.has(id))
      if (missing.length > 0) {
        // 예전 버전을 쓰는 시험지: 정책마다 버전 목록에서 찾음 (문서 수가 적어 한 번씩만 요청)
        const lists = await Promise.all(policies.map((p) => listPolicyVersions(projectId, p.id, { limit: 100, signal })))
        lists.forEach((page, i) => {
          for (const version of page.items) {
            if (missing.includes(version.id)) versions.set(version.id, { name: policies[i].name, version })
          }
        })
      }

      return {
        sources: details.map((d) => ({ policyId: d.policy.id, name: d.policy.name, latestVersionId: d.version.id })),
        versions,
      }
    },
    [projectId, key],
  )

  const loaded = query.data
  const options = useMemo(() => {
    const list: EvidenceOption[] = []
    if (!loaded) return list
    // 시험지가 있으면 그 시험지의 정책 버전만, 없으면 최신 버전 전체
    const ids = usedVersionIds.length > 0 ? usedVersionIds : loaded.sources.map((s) => s.latestVersionId)
    for (const id of ids) {
      const entry = loaded.versions.get(id)
      if (!entry) continue
      for (const rule of entry.version.rules) {
        list.push({
          value: evidenceKey(id, rule.key),
          label: `${entry.name} · ${rule.description}`,
          policyVersionId: id,
          ruleKey: rule.key,
          sourceQuote: rule.sourceQuote,
        })
      }
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, key])

  const names = useMemo(() => new Map([...(loaded?.versions ?? new Map()).entries()].map(([id, v]) => [id, v.name])), [loaded])

  return {
    sources: loaded?.sources ?? [],
    /** 정책 버전 ID → 정책 이름 */
    names,
    options,
    optionMap: useMemo(() => new Map(options.map((o) => [o.value, o])), [options]),
    loading: query.loading,
    error: query.error,
    reload: query.reload,
  }
}
