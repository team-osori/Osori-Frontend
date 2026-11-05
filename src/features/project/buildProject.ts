import type { Project } from '../../types/project'
import { hostOf, type NewProject } from './CreateProjectModal'

/** 막 만든 프로젝트: 아직 평가 기록이 없고 1단계(시험지 만들기) 상태 */
export function buildProject({ name, description, endpointUrl }: NewProject): Project {
  return {
    id: crypto.randomUUID(),
    name,
    description: description || undefined,
    host: hostOf(endpointUrl),
    status: 'setup',
    scores: { retrieval: null, grounding: null, response: null, policy: null },
    lastEvaluatedAt: null,
    promptVersion: null,
    currentStep: 1,
  }
}
