import type { CurrentUser, Project } from '../../types/project'

/** API 연동 전까지 쓰는 시안 샘플 데이터 */
export const MOCK_USER: CurrentUser = { name: '김QA', role: '어드민', email: 'qa@moamall.co.kr' }

export const MOCK_INSTANCE_VERSION = 'v1.4.2'

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'moamall-cs',
    name: '모아몰 CS 챗봇',
    host: 'cs-bot.moamall.internal',
    status: 'done',
    scores: { retrieval: 91, grounding: 90, response: 88, policy: 90 },
    lastEvaluatedAt: '2026-11-04 14:20',
    promptVersion: 3,
    currentStep: 3,
  },
  {
    id: 'moamall-cs-staging',
    name: '모아몰 CS 챗봇 (스테이징)',
    host: 'cs-bot-stg.moamall.internal',
    status: 'running',
    scores: { retrieval: 91, grounding: 88, response: 83, policy: 81 },
    lastEvaluatedAt: '2026-11-05 09:12',
    promptVersion: 2,
    currentStep: 2,
  },
  {
    id: 'faq-bot',
    name: 'FAQ 챗봇',
    host: 'faq-bot.moamall.internal',
    status: 'setup',
    scores: { retrieval: null, grounding: null, response: null, policy: null },
    lastEvaluatedAt: null,
    promptVersion: null,
    currentStep: 1,
  },
]
