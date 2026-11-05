import type { CurrentUser, Project } from '../../types/project'

/** API 연동 전까지 쓰는 Figma 샘플 데이터 */
export const MOCK_USER: CurrentUser = { name: '김QA', role: '어드민' }

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'moamall-cs',
    name: '모아몰 CS 챗봇',
    status: 'done',
    scores: { retrieval: 91, grounding: 90, response: 88, policy: 90 },
    lastEvaluatedAt: '2026-11-04 14:20',
    promptVersion: 3,
    progressText: '7단계 중 6단계 완료',
  },
  {
    id: 'moamall-cs-staging',
    name: '모아몰 CS 챗봇 (스테이징)',
    status: 'running',
    scores: { retrieval: 91, grounding: 88, response: 83, policy: 81 },
    lastEvaluatedAt: '2026-11-05 09:12',
    promptVersion: 2,
    progressText: '5 · 사람 판정 진행 중',
  },
  {
    id: 'new-project',
    name: '새 프로젝트',
    status: 'setup',
    scores: { retrieval: null, grounding: null, response: null, policy: null },
    lastEvaluatedAt: null,
    promptVersion: null,
    progressText: '1 · 연결 설정',
  },
]
