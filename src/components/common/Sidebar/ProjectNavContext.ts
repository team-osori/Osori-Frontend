import { createContext, useContext } from 'react'
import type { ProjectSwitchItem } from '../ProjectSelector/ProjectSwitcher'

/**
 * App이 내려주는 프로젝트 목록과 새 프로젝트 만들기 동작.
 * 평가 화면마다 따로 넘기지 않아도 사이드바의 프로젝트 전환 팝오버가 이 값을 씁니다.
 */
export type ProjectNav = {
  projects: ProjectSwitchItem[]
  onCreateProject: () => void
}

export const ProjectNavContext = createContext<ProjectNav | null>(null)

export function useProjectNav() {
  return useContext(ProjectNavContext)
}
