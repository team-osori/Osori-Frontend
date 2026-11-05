import { useCallback } from 'react'
import { usePagedList, useApiQuery } from '../../lib/api'
import {
  addQuestion,
  confirmTestSetVersion,
  createTestSet,
  deleteQuestion,
  editQuestion,
  generateQuestions,
  getTestSetVersion,
  listTestSetVersions,
  listTestSets,
  reviewQuestion,
  type QuestionInput,
  type ReviewDecision,
  type TestSet,
  type TestSetCreateInput,
  type TestSetDetail,
  type TestSetVersion,
  type TestSetVersionSummary,
} from './testsetApi'

const PAGE_SIZE = 20

/** 프로젝트의 테스트셋 목록 */
export function useTestSets(projectId: string | undefined) {
  const list = usePagedList<TestSet>({
    fetchPage: ({ cursor, signal }) => listTestSets(projectId!, { limit: PAGE_SIZE, cursor, signal }),
    getKey: (testSet) => testSet.id,
    deps: [projectId],
    enabled: Boolean(projectId),
  })
  const { prepend } = list

  const create = useCallback(
    async (input: TestSetCreateInput): Promise<TestSetDetail> => {
      if (!projectId) throw new RangeError('프로젝트가 선택되지 않았습니다.')
      const created = await createTestSet(projectId, input)
      prepend(created.testSet)
      return created
    },
    [projectId, prepend],
  )

  return { ...list, create }
}

/** 테스트셋의 버전 목록(질문 없이 요약만) */
export function useTestSetVersions(projectId: string | undefined, testSetId: string | undefined) {
  return usePagedList<TestSetVersionSummary>({
    fetchPage: ({ cursor, signal }) => listTestSetVersions(projectId!, testSetId!, { limit: PAGE_SIZE, cursor, signal }),
    getKey: (version) => version.id,
    deps: [projectId, testSetId],
    enabled: Boolean(projectId && testSetId),
  })
}

/**
 * 테스트셋 버전 하나와 그 안의 질문 편집.
 * 질문을 바꾸는 요청은 모두 이 버전의 revision을 보내고, 서버가 돌려준 새 버전으로 화면을 바로 바꿉니다.
 * 그래서 연이어 호출해도 revision이 어긋나지 않습니다. 다른 사람이 먼저 고쳤으면 409/412를 던지니 reload로 다시 받으세요.
 *
 * const { version, addQuestion, review, confirm } = useTestSetVersion(projectId, testSetId, versionId)
 */
export function useTestSetVersion(
  projectId: string | undefined,
  testSetId: string | undefined,
  versionId: string | undefined,
) {
  const query = useApiQuery<TestSetVersion | null>(
    (signal) =>
      projectId && testSetId && versionId
        ? getTestSetVersion(projectId, testSetId, versionId, { signal })
        : Promise.resolve(null),
    [projectId, testSetId, versionId],
  )
  const { data, setData, reload } = query
  const version = data ?? null

  /** 편집 요청에 필요한 값을 한 번에 확인 (선택이 안 됐거나 아직 못 불러왔으면 던짐) */
  const target = () => {
    if (!projectId || !testSetId || !versionId || !version) throw new RangeError('테스트셋 버전을 아직 불러오지 못했습니다.')
    return { projectId, testSetId, versionId, revision: version.revision }
  }

  const add = useCallback(
    async (input: QuestionInput) => {
      const t = target()
      const next = await addQuestion(t.projectId, t.testSetId, t.versionId, input, t.revision)
      setData(next)
      return next
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, testSetId, versionId, version?.revision, setData],
  )

  const edit = useCallback(
    async (questionId: string, input: QuestionInput) => {
      const t = target()
      const next = await editQuestion(t.projectId, t.testSetId, t.versionId, questionId, input, t.revision)
      setData(next)
      return next
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, testSetId, versionId, version?.revision, setData],
  )

  /** 삭제 응답에는 본문이 없어서, 새 revision을 얻으려고 버전을 다시 불러옵니다. */
  const remove = useCallback(
    async (questionId: string) => {
      const t = target()
      await deleteQuestion(t.projectId, t.testSetId, t.versionId, questionId, t.revision)
      const next = await getTestSetVersion(t.projectId, t.testSetId, t.versionId)
      setData(next)
      return next
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, testSetId, versionId, version?.revision, setData],
  )

  const review = useCallback(
    async (questionId: string, decision: ReviewDecision, note?: string | null) => {
      const t = target()
      const next = await reviewQuestion(t.projectId, t.testSetId, t.versionId, questionId, decision, t.revision, note)
      setData(next)
      return next
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, testSetId, versionId, version?.revision, setData],
  )

  const generate = useCallback(
    async (count?: number, options: { idempotencyKey?: string } = {}) => {
      const t = target()
      const next = await generateQuestions(
        t.projectId,
        t.testSetId,
        t.versionId,
        { expectedRevision: t.revision, count },
        options,
      )
      setData(next)
      return next
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, testSetId, versionId, version?.revision, setData],
  )

  const confirm = useCallback(
    async () => {
      const t = target()
      const next = await confirmTestSetVersion(t.projectId, t.testSetId, t.versionId, t.revision)
      setData(next)
      return next
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, testSetId, versionId, version?.revision, setData],
  )

  return {
    version,
    loading: query.loading,
    error: query.error,
    reload,
    add,
    edit,
    remove,
    review,
    generate,
    confirm,
  }
}
