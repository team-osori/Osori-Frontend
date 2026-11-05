import { errorMessage } from '../../lib/api'
import { putSecret, saveConnection } from '../connection/connectionApi'
import { DEFAULT_ENDPOINT_FORM, toConnectionInput } from '../connection/connectionForm'
import { uploadPolicyFile } from '../policy/api'
import { createPrompt } from '../prompt/api'
import { createService } from '../service/api'
import { createProject, type ProjectResponse } from './api'
import type { NewProject } from './CreateProjectModal'

/** 새 프로젝트의 첫 시스템 프롬프트 이름 */
export const DEFAULT_PROMPT_NAME = '기본 프롬프트'

export type SetupResult = {
  project: ProjectResponse
  /** 프로젝트는 만들었지만 실패한 단계. 프로젝트 설정에서 다시 할 수 있습니다. */
  warnings: string[]
}

/**
 * 새 프로젝트 모달의 입력으로 프로젝트 → 서비스 → 연결 설정 → 인증 키 → 시스템 프롬프트 → 정책 문서를 차례로 만듭니다.
 *
 * 프로젝트를 만들지 못하면 오류를 던집니다. 그 뒤 단계가 실패하면 이미 만든 프로젝트는 그대로 두고
 * warnings에 담아 돌려줍니다(되돌리는 API가 없고, 프로젝트 설정에서 이어서 할 수 있으므로).
 * 서비스나 연결 설정이 실패하면 그 뒤 단계는 진행할 수 없어서 건너뜁니다.
 */
export async function setupProject(input: NewProject): Promise<SetupResult> {
  const project = await createProject({ name: input.name, description: input.description })
  const warnings: string[] = []
  const fail = (step: string, error: unknown) => warnings.push(`${step}: ${errorMessage(error)}`)

  let serviceId: string
  try {
    serviceId = (await createService(project.id, { name: input.name })).id
  } catch (error) {
    fail('서비스 등록', error)
    return { project, warnings }
  }

  const form = { ...DEFAULT_ENDPOINT_FORM, endpointUrl: input.endpointUrl, authToken: input.authToken, answerPointer: input.answerPointer || DEFAULT_ENDPOINT_FORM.answerPointer }
  try {
    const connection = await saveConnection(project.id, serviceId, toConnectionInput(form, null))
    if (input.authToken) {
      try {
        await putSecret(project.id, serviceId, input.authToken, connection.revision)
      } catch (error) {
        fail('인증 토큰 저장', error)
      }
    }
  } catch (error) {
    fail('서비스 연결 저장', error)
  }

  try {
    await createPrompt(project.id, serviceId, { name: DEFAULT_PROMPT_NAME, content: input.systemPrompt })
  } catch (error) {
    fail('시스템 프롬프트 저장', error)
  }

  // 업로드는 서버에서 문서를 읽는 시간이 걸려 한 번에 하나씩 보냄
  for (const file of input.policyFiles) {
    try {
      await uploadPolicyFile(project.id, file)
    } catch (error) {
      fail(`정책 문서 ${file.name}`, error)
    }
  }

  return { project, warnings }
}
