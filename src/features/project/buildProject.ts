import type { Project } from '../../types/project'
import type { NewProject } from './CreateProjectModal'

/** 막 만든 프로젝트: 아직 평가 기록이 없고 1단계(연결 설정) 전 상태 */
export function buildProject({ name, description }: NewProject): Project {
  return {
    id: crypto.randomUUID(),
    name,
    description: description || undefined,
    status: 'setup',
    scores: { retrieval: null, grounding: null, response: null, policy: null },
    lastEvaluatedAt: null,
    promptVersion: null,
    progressText: '1 · 연결 설정',
    currentStep: 1,
  }
}
