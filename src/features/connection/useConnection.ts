import { useCallback, useEffect, useRef, useState } from 'react'
import { isApiError, useApiQuery } from '../../lib/api'
import {
  deleteSecret,
  getConnection,
  isConnectionVerified,
  putSecret,
  runConnectionTest,
  saveConnection,
  type ConnectionInput,
  type ConnectionResponse,
  type ConnectionTest,
  type ConnectionTestInput,
} from './connectionApi'

/**
 * 서비스 연결 설정. 아직 저장한 적이 없으면(404) connection이 null입니다.
 * 저장 · 키 변경은 서버가 돌려준 최신 값으로 화면을 바로 바꿉니다.
 *
 * const { connection, verified, save, saveSecret } = useConnection(projectId, serviceId)
 */
export function useConnection(projectId: string | undefined, serviceId: string | undefined) {
  const query = useApiQuery<ConnectionResponse | null>(
    async (signal) => {
      if (!projectId || !serviceId) return null
      try {
        return await getConnection(projectId, serviceId, { signal })
      } catch (error) {
        // 가정: 저장한 연결 설정이 없으면 서버가 404를 줍니다. 명세는 모든 API에 404를 똑같이 나열해서
        // 이 경우를 따로 확인할 수 없습니다. 실제 서버에서 다르게 응답하면 이 줄을 고쳐야 합니다.
        if (isApiError(error) && error.status === 404) return null
        throw error
      }
    },
    [projectId, serviceId],
  )
  const { data: connection, setData } = query

  const requireIds = () => {
    if (!projectId || !serviceId) throw new RangeError('프로젝트와 서비스가 선택되지 않았습니다.')
    return { projectId, serviceId }
  }

  /** 설정 저장(처음이면 만들기). 다른 사람이 먼저 고쳤으면 409/412 오류를 던지니 다시 불러와야 합니다. */
  const save = useCallback(
    async (input: ConnectionInput) => {
      const ids = requireIds()
      const saved = await saveConnection(ids.projectId, ids.serviceId, input, connection?.revision ?? null)
      setData(saved)
      return saved
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, serviceId, connection?.revision, setData],
  )

  /** 인증 키 저장. 키 값은 서버에서 다시 받을 수 없으므로 화면에 저장 여부만 반영합니다. */
  const saveSecret = useCallback(
    async (secret: string) => {
      const ids = requireIds()
      if (!connection) throw new RangeError('연결 설정을 먼저 저장해야 키를 저장할 수 있습니다.')
      const result = await putSecret(ids.projectId, ids.serviceId, secret, connection.revision)
      // 키를 바꾸면 연결 설정의 revision이 바뀔 수 있어 서버의 최신 상태를 다시 읽음
      query.reload()
      return result
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, serviceId, connection, query.reload],
  )

  const removeSecret = useCallback(async () => {
    const ids = requireIds()
    if (!connection) throw new RangeError('연결 설정이 없습니다.')
    await deleteSecret(ids.projectId, ids.serviceId, connection.revision)
    query.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, serviceId, connection, query.reload])

  return {
    connection: connection ?? null,
    loading: query.loading,
    /** 한 번이라도 불러왔는지. 다시 불러오는 중에도 이전 값을 보여줄 때 씀 */
    loaded: connection !== undefined,
    error: query.error,
    /** 지금 설정으로 연결 테스트를 통과했는지 */
    verified: connection ? isConnectionVerified(connection) : false,
    reload: query.reload,
    save,
    saveSecret,
    removeSecret,
  }
}

type TestState = { running: boolean; result: ConnectionTest | null; error: unknown }

/**
 * 연결 테스트 실행. run을 부르면 테스트를 요청하고 끝날 때까지 진행 상황을 result에 갱신합니다.
 * 화면을 벗어나거나 cancel을 부르면 더 조회하지 않습니다(서버에서 이미 시작된 테스트는 그대로 진행됩니다).
 */
export function useConnectionTest(projectId: string | undefined, serviceId: string | undefined) {
  const [state, setState] = useState<TestState>({ running: false, result: null, error: undefined })
  const controllerRef = useRef<AbortController | null>(null)
  // 같은 순간에 run이 두 번 불려도 한 번만 시작하도록 렌더와 무관하게 바로 바뀌는 ref로 막음
  const runningRef = useRef(false)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (input: ConnectionTestInput) => {
      if (!projectId || !serviceId || runningRef.current) return undefined
      runningRef.current = true
      const controller = new AbortController()
      controllerRef.current = controller
      setState({ running: true, result: null, error: undefined })
      try {
        const result = await runConnectionTest(projectId, serviceId, input, {
          signal: controller.signal,
          onUpdate: (value) => {
            if (!controller.signal.aborted) setState((prev) => ({ ...prev, result: value }))
          },
        })
        if (!controller.signal.aborted) setState({ running: false, result, error: undefined })
        return result
      } catch (error) {
        if (!controller.signal.aborted) setState((prev) => ({ ...prev, running: false, error }))
        return undefined
      } finally {
        // 취소로 이미 다음 실행이 시작됐다면 그 실행의 표시를 지우지 않음
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
