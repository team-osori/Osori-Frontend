import { useCallback, useEffect, useRef, useState } from 'react'
import { usePagedList } from '../../lib/api'
import {
  listEvaluationItems,
  listEvaluations,
  runEvaluation,
  type Evaluation,
  type EvaluationInput,
  type EvaluationChange,
  type EvaluationFilterCriterion,
  type EvaluationIssueKind,
  type EvaluationResultStatus,
  type EvaluationItemSummary,
} from './api'

const PAGE_SIZE = 20

/** 목록 필터. change는 criterion과 함께만 쓸 수 있습니다(서버 규칙). */
type EvaluationItemFilter =
  | { criterion?: EvaluationFilterCriterion; change?: undefined; resultStatus?: EvaluationResultStatus; issueKind?: EvaluationIssueKind }
  | { criterion: EvaluationFilterCriterion; change: EvaluationChange; resultStatus?: EvaluationResultStatus; issueKind?: EvaluationIssueKind }

/** 서비스의 평가 목록 */
export function useEvaluations(projectId: string | undefined, serviceId: string | undefined) {
  return usePagedList<Evaluation>({
    fetchPage: ({ cursor, signal }) => listEvaluations(projectId!, serviceId!, { limit: PAGE_SIZE, cursor, signal }),
    getKey: (evaluation) => evaluation.id,
    deps: [projectId, serviceId],
    enabled: Boolean(projectId && serviceId),
  })
}

/** 한 평가의 질문별 결과 목록. 기준 · 판정 결과 · 문제 종류 · 변화 필터가 바뀌면 처음부터 다시 불러옵니다. */
export function useEvaluationItems(
  projectId: string | undefined,
  serviceId: string | undefined,
  evaluationId: string | undefined,
  filter: EvaluationItemFilter = {},
) {
  return usePagedList<EvaluationItemSummary>({
    fetchPage: ({ cursor, signal }) =>
      listEvaluationItems(projectId!, serviceId!, evaluationId!, { ...filter, limit: PAGE_SIZE, cursor, signal }),
    getKey: (item) => item.id,
    deps: [projectId, serviceId, evaluationId, filter.criterion, filter.resultStatus, filter.issueKind, filter.change],
    enabled: Boolean(projectId && serviceId && evaluationId),
  })
}

type RunState = { running: boolean; evaluation: Evaluation | null; error: unknown }

/**
 * 평가 실행. run을 부르면 평가를 요청하고 끝날 때까지 진행 상황(완료/실패 질문 수)을 evaluation에 갱신합니다.
 * 화면을 벗어나거나 cancel을 부르면 더 조회하지 않습니다(서버에서 이미 시작된 평가는 그대로 진행됩니다).
 */
export function useEvaluationRun(projectId: string | undefined, serviceId: string | undefined) {
  const [state, setState] = useState<RunState>({ running: false, evaluation: null, error: undefined })
  const controllerRef = useRef<AbortController | null>(null)
  const runningRef = useRef(false)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (input: EvaluationInput) => {
      if (!projectId || !serviceId || runningRef.current) return undefined
      runningRef.current = true
      const controller = new AbortController()
      controllerRef.current = controller
      setState({ running: true, evaluation: null, error: undefined })
      try {
        const evaluation = await runEvaluation(projectId, serviceId, input, {
          signal: controller.signal,
          onUpdate: (value) => {
            if (!controller.signal.aborted) setState((prev) => ({ ...prev, evaluation: value }))
          },
        })
        if (!controller.signal.aborted) setState({ running: false, evaluation, error: undefined })
        return evaluation
      } catch (error) {
        if (!controller.signal.aborted) setState((prev) => ({ ...prev, running: false, error }))
        return undefined
      } finally {
        // 취소 뒤 새 실행이 이미 시작됐다면 그 실행의 잠금을 풀지 않음
        if (controllerRef.current === controller) runningRef.current = false
      }
    },
    [projectId, serviceId],
  )

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    runningRef.current = false
    setState((prev) => ({ ...prev, running: false }))
  }, [])

  return { ...state, run, cancel }
}
