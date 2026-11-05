import type { ProjectScores, ProjectStatus } from '../components/common'

export type Project = {
  id: string
  name: string
  /** 어떤 서비스를 평가하는지 적어 둔 설명 */
  description?: string
  status: ProjectStatus
  scores: ProjectScores
  /** 마지막 평가 시각 (YYYY-MM-DD HH:mm). 평가 기록이 없으면 null */
  lastEvaluatedAt: string | null
  /** 마지막으로 평가한 프롬프트 버전. 평가 기록이 없으면 null */
  promptVersion: number | null
  /** 카드 하단 진행 상황 문구 */
  progressText: string
  /** 지금 진행 중인 평가 단계(1~7). 카드 버튼이 이 단계의 화면을 엽니다. 완료된 프로젝트는 결과를 보는 4단계 */
  currentStep: number
}

export type CurrentUser = { name: string; role: string; email: string }
