import type { ProjectScores, ProjectStatus } from '../components/common'

export type Project = {
  id: string
  name: string
  /** 어떤 서비스를 평가하는지 적어 둔 설명 */
  description?: string
  /** 평가 대상 서비스 주소 (예: cs-bot.moamall.internal) */
  host: string
  status: ProjectStatus
  scores: ProjectScores
  /** 마지막 평가 시각 (YYYY-MM-DD HH:mm). 평가 기록이 없으면 null */
  lastEvaluatedAt: string | null
  /** 마지막으로 평가한 프롬프트 버전. 평가 기록이 없으면 null */
  promptVersion: number | null
  /** 지금 진행 중인 평가 단계(1 시험지 만들기 · 2 채점 · 3 오답 노트). 목록에서 누르면 이 단계 화면을 엽니다 */
  currentStep: number
}

export type CurrentUser = { name: string; role: string; email: string }
