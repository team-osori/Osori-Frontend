import type { ReactNode } from 'react'
import { Divider, Icon, SearchInput, type SelectOption } from '../../ui'
import { BrandMark } from '../BrandMark/BrandMark'
import { NavItem } from '../NavItem/NavItem'
import { ProjectSelector } from '../ProjectSelector/ProjectSelector'
import { StepList } from '../StepItem/StepItem'
import { UserProfile } from '../UserProfile/UserProfile'
import { useSidebarToggle } from './SidebarContext'
import styles from './Sidebar.module.css'

type User = { name: string; role: string }

type SidebarProps = {
  user: User
  onToggle?: () => void
  onUserClick?: () => void
  children: ReactNode
}

/** 사이드바 공통 틀: 브랜드 + 접기 버튼 / 본문 / 사용자 프로필 */
export function Sidebar({ user, onToggle, onUserClick, children }: SidebarProps) {
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
        <UserProfile name={user.name} role={user.role} onClick={onUserClick} />
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

type HomeMenu = 'projects' | 'create'

type HomeSidebarProps = {
  user: User
  projectCount: number
  active?: HomeMenu
  onNavigate?: (menu: HomeMenu) => void
  onSearch?: (keyword: string) => void
  onToggle?: () => void
  onUserClick?: () => void
}

export function HomeSidebar({
  user,
  projectCount,
  active = 'projects',
  onNavigate,
  onSearch,
  onToggle,
  onUserClick,
}: HomeSidebarProps) {
  return (
    <Sidebar user={user} onToggle={onToggle} onUserClick={onUserClick}>
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
    </Sidebar>
  )
}

/* ---------- 프로젝트 내부(평가 단계) 사이드바 ---------- */

type ProjectSidebarProps = {
  user: User
  projectName: string
  promptOptions: SelectOption[]
  promptValue: string
  onPromptChange: (value: string) => void
  questionSet: string
  /** 현재 단계(1~7). 프로젝트 설정 화면이면 settingsActive 사용 */
  currentStep: number
  unlockedUntil?: number
  settingsActive?: boolean
  onBack?: () => void
  onSelectStep?: (index: number) => void
  onSettings?: () => void
  onProjectClick?: () => void
  onToggle?: () => void
  onUserClick?: () => void
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
  onToggle,
  onUserClick,
}: ProjectSidebarProps) {
  return (
    <Sidebar user={user} onToggle={onToggle} onUserClick={onUserClick}>
      <button type="button" className={styles.back} onClick={onBack}>
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
      />
      <SidebarSectionLabel>평가 단계</SidebarSectionLabel>
      <StepList
        current={currentStep}
        unlockedUntil={unlockedUntil}
        highlightCurrent={!settingsActive}
        onSelect={onSelectStep}
      />
      <SidebarDivider />
      <NavItem size="sm" icon="settings" label="프로젝트 설정" active={settingsActive} onClick={onSettings} />
    </Sidebar>
  )
}
