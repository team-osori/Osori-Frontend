import type { ReactNode } from 'react'
import { Divider, Icon, SearchInput, type SelectOption } from '../../ui'
import { ROUTES, stepRoute } from '../../../routes'
import { BrandMark } from '../BrandMark/BrandMark'
import { NavItem } from '../NavItem/NavItem'
import { ProjectSelector, type ProjectSwitchOptions } from '../ProjectSelector/ProjectSelector'
import type { PromptVersion } from '../ProjectSelector/PromptVersionPicker'
import { StepList } from '../StepItem/StepItem'
import { UserMenu, type UserMenuActions } from '../UserMenu/UserMenu'
import { UserProfile } from '../UserProfile/UserProfile'
import { useProjectNav } from './ProjectNavContext'
import { useSidebarToggle } from './SidebarContext'
import styles from './Sidebar.module.css'

type User = { name: string; role: string; email?: string }

/** 사이드바의 기본 이동. 해시 주소를 바꾸면 App의 useHashRoute가 화면을 바꿉니다. */
function goTo(route: string | undefined) {
  if (route) window.location.hash = route
}

type SidebarProps = {
  user: User
  onToggle?: () => void
  onUserClick?: () => void
  /** 주면 하단 프로필을 누를 때 계정 메뉴가 열립니다. (user.email 필요) */
  userMenu?: UserMenuActions
  children: ReactNode
}

/** 사이드바 공통 틀: 브랜드 + 접기 버튼 / 본문 / 사용자 프로필 */
export function Sidebar({ user, onToggle, onUserClick, userMenu, children }: SidebarProps) {
  const layoutToggle = useSidebarToggle()
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <BrandMark tone="sidebar" />
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle ?? layoutToggle}
          aria-label="사이드바 접기"
          data-sidebar-toggle
        >
          <Icon name="sidebar" />
        </button>
      </div>
      <nav className={styles.body}>{children}</nav>
      <div className={styles.footer}>
        <Divider tone="strong" />
        {userMenu && user.email ? (
          <UserMenu name={user.name} role={user.role} email={user.email} {...userMenu} />
        ) : (
          <UserProfile name={user.name} role={user.role} onClick={onUserClick} />
        )}
      </div>
    </aside>
  )
}

export function SidebarSectionLabel({ children }: { children: ReactNode }) {
  return <p className={styles.sectionLabel}>{children}</p>
}

export function SidebarList({ children }: { children: ReactNode }) {
  return <div className={styles.list}>{children}</div>
}

export function SidebarDivider() {
  return (
    <div className={styles.divider}>
      <Divider tone="strong" />
    </div>
  )
}

/* ---------- 홈(전체 프로젝트) 사이드바 ---------- */

export type HomeMenu = 'projects' | 'create' | 'trash' | 'settings'

type HomeSidebarProps = {
  user: User
  projectCount: number
  active?: HomeMenu
  onNavigate?: (menu: HomeMenu) => void
  onSearch?: (keyword: string) => void
  onToggle?: () => void
  onUserClick?: () => void
  userMenu?: UserMenuActions
}

export function HomeSidebar({
  user,
  projectCount,
  active = 'projects',
  onNavigate,
  onSearch,
  onToggle,
  onUserClick,
  userMenu,
}: HomeSidebarProps) {
  return (
    <Sidebar user={user} onToggle={onToggle} onUserClick={onUserClick} userMenu={userMenu}>
      <SearchInput placeholder="프로젝트 검색" onChange={(e) => onSearch?.(e.target.value)} />
      <SidebarSectionLabel>프로젝트</SidebarSectionLabel>
      <SidebarList>
        <NavItem
          icon="grid"
          label="전체 프로젝트"
          count={projectCount}
          active={active === 'projects'}
          onClick={() => onNavigate?.('projects')}
        />
        <NavItem icon="plus" label="프로젝트 만들기" active={active === 'create'} onClick={() => onNavigate?.('create')} />
      </SidebarList>
      <SidebarDivider />
      <SidebarList>
        <NavItem icon="trash" label="휴지통" active={active === 'trash'} onClick={() => onNavigate?.('trash')} />
        <NavItem icon="settings" label="설정" active={active === 'settings'} onClick={() => onNavigate?.('settings')} />
      </SidebarList>
    </Sidebar>
  )
}

/* ---------- 프로젝트 내부(평가 단계) 사이드바 ---------- */

type ProjectSidebarProps = {
  user: User
  projectName: string
  /** promptVersions를 주면 쓰지 않음 */
  promptOptions?: SelectOption[]
  promptValue: string
  onPromptChange: (value: string) => void
  questionSet: string
  /** 현재 단계(1~7). 프로젝트 설정 화면이면 settingsActive 사용 */
  currentStep: number
  unlockedUntil?: number
  settingsActive?: boolean
  /** 없으면 프로젝트 목록(#/projects)으로 이동 */
  onBack?: () => void
  /** 없으면 그 단계의 화면으로 이동 (routes.ts의 STEP_ROUTES) */
  onSelectStep?: (index: number) => void
  /** 없으면 프로젝트 설정 화면으로 이동 */
  onSettings?: () => void
  onProjectClick?: () => void
  /** 주면 프롬프트 칸이 버전 기록 팝오버로 바뀝니다. 최신 버전이 맨 앞 */
  promptVersions?: PromptVersion[]
  /** 없으면 새 버전을 만드는 개선안 적용(7단계) 화면으로 이동 */
  onCreateVersion?: () => void
  /** 없으면 버전 목록이 있는 자동 채점 결과(4단계) 화면으로 이동 */
  onShowVersionHistory?: () => void
  onToggle?: () => void
  onUserClick?: () => void
  userMenu?: UserMenuActions
}

export function ProjectSidebar({
  user,
  projectName,
  promptOptions,
  promptValue,
  onPromptChange,
  questionSet,
  currentStep,
  unlockedUntil,
  settingsActive,
  onBack,
  onSelectStep,
  onSettings,
  onProjectClick,
  promptVersions,
  onCreateVersion,
  onShowVersionHistory,
  onToggle,
  onUserClick,
  userMenu,
}: ProjectSidebarProps) {
  const nav = useProjectNav()
  // 프로젝트 목록을 App이 내려줄 때만 프로젝트 전환 팝오버를 씀
  const projectSwitch: ProjectSwitchOptions | undefined = nav
    ? {
        projects: nav.projects,
        currentId: nav.projects.find((p) => p.name === projectName)?.id,
        onSelect: (project) => goTo(stepRoute(project.currentStep)),
        onCreate: nav.onCreateProject,
        onShowAll: () => goTo(ROUTES.projects),
      }
    : undefined

  return (
    <Sidebar user={user} onToggle={onToggle} onUserClick={onUserClick} userMenu={userMenu}>
      <button type="button" className={styles.back} onClick={onBack ?? (() => goTo(ROUTES.projects))}>
        <Icon name="arrowLeft" />
        전체 프로젝트
      </button>
      <ProjectSelector
        projectName={projectName}
        promptOptions={promptOptions}
        promptValue={promptValue}
        onPromptChange={onPromptChange}
        questionSet={questionSet}
        onProjectClick={onProjectClick}
        projectSwitch={projectSwitch}
        promptVersions={
          promptVersions && {
            versions: promptVersions,
            onCreate: onCreateVersion ?? (() => goTo(stepRoute(7))),
            onShowHistory: onShowVersionHistory ?? (() => goTo(stepRoute(4))),
          }
        }
      />
      <SidebarSectionLabel>평가 단계</SidebarSectionLabel>
      <StepList
        current={currentStep}
        unlockedUntil={unlockedUntil}
        highlightCurrent={!settingsActive}
        onSelect={onSelectStep ?? ((step) => goTo(stepRoute(step)))}
      />
      <SidebarDivider />
      <NavItem
        size="sm"
        icon="settings"
        label="프로젝트 설정"
        active={settingsActive}
        onClick={onSettings ?? (() => goTo(ROUTES.projectSettings))}
      />
    </Sidebar>
  )
}
