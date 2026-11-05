import { createContext, useContext } from 'react'
import type { ProjectSwitchItem } from '../ProjectSelector/ProjectSwitcher'
import type { UserMenuActions } from '../UserMenu/UserMenu'

/**
 * App이 내려주는 공통 정보: 로그인한 사용자, 계정 메뉴 동작, 프로젝트 목록, 새 프로젝트 만들기.
 * 화면마다 따로 넘기지 않아도 사이드바(레일 아바타 · 프로젝트 전환 팝오버)가 이 값을 씁니다.
 */
export type ProjectNav = {
  projects: ProjectSwitchItem[]
  onCreateProject: () => void
  /** 프로젝트 전환 팝오버에서 다른 프로젝트를 골랐을 때 (없으면 그 프로젝트 단계 화면으로만 이동) */
  onOpenProject?: (project: ProjectSwitchItem) => void
  /** 지금 연 프로젝트에서 열려 있는 단계(1~3). 이전 단계 화면을 봐도 이 단계까지는 잠기지 않음 */
  unlockedStage?: number
  user?: { name: string; role: string; email: string }
  userMenu?: UserMenuActions
}

export const ProjectNavContext = createContext<ProjectNav | null>(null)

export function useProjectNav() {
  return useContext(ProjectNavContext)
}
