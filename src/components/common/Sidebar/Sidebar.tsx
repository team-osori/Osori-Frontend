import type { ReactNode } from 'react'
import { Button, Icon, type SelectOption } from '../../ui'
import { ROUTES, STAGES, stageOf, stageRoute } from '../../../routes'
import { BrandMark } from '../BrandMark/BrandMark'
import { NavItem } from '../NavItem/NavItem'
import { ProjectSelector, type ProjectSwitchOptions } from '../ProjectSelector/ProjectSelector'
import type { PromptVersion } from '../ProjectSelector/PromptVersionPicker'
import { StageList } from '../StepItem/StepItem'
import { UserMenu, type UserMenuActions } from '../UserMenu/UserMenu'
import { useProjectNav } from './ProjectNavContext'
import { useSidebarUser } from './SidebarUserContext'
import styles from './Sidebar.module.css'

type User = { name: string; role: string; email?: string }

/** 사이드바의 기본 이동. 해시 주소를 바꾸면 App의 useHashRoute가 화면을 바꿉니다. */
function goTo(route: string | undefined) {
  if (route) window.location.hash = route
}

/** 화면 이동 메뉴. 레일 아이콘은 없앴고 로고(전체 프로젝트) · 아바타 메뉴(계정 설정)로 이동 */
export type HomeMenu = 'projects' | 'create' | 'trash' | 'settings'

type SidebarProps = {
  /** 예전 레일 아이콘 강조용 (지금은 쓰지 않음) */
  active?: HomeMenu
  /** 없으면 App이 내려준 사용자(ProjectNavContext) 사용 */
  user?: User
  userMenu?: UserMenuActions
  /** 예전 레일 아이콘 이동용 (지금은 쓰지 않음) */
  onNavigate?: (menu: HomeMenu) => void
  /** 보조 패널 내용 */
  children: ReactNode
  /** 패널 맨 아래 고정 영역 (예: 프로젝트 설정) */
  panelFooter?: ReactNode
}

/** 사이드바 공통 틀: 맨 위 로고 · 화면별 내용 · 아래 고정 메뉴 · 맨 아래 계정 */
export function Sidebar({ user, userMenu, children, panelFooter }: SidebarProps) {
  const nav = useProjectNav()
  const signedIn = useSidebarUser()
  const base = user ?? nav?.user
  // 로그인한 사용자가 있으면 그 이름 · 계정 메뉴가 우선
  const me = signedIn ? { ...base, name: signedIn.name, email: signedIn.account } : base
  const menu = signedIn?.menu ?? userMenu ?? nav?.userMenu
  const email = me?.email

  return (
    <aside className={styles.sidebar}>
      <a href={`#${ROUTES.projects}`} className={styles.logo} aria-label="Pebble · 전체 프로젝트">
        <BrandMark />
      </a>
      <div className={styles.panelBody}>{children}</div>
      {panelFooter && <div className={styles.panelFooter}>{panelFooter}</div>}
      {me && (
        <div className={styles.account}>
          {menu && email ? (
            <UserMenu name={me.name} email={email} {...menu} />
          ) : (
            <span className={styles.profile}>
              <span className={styles.avatar}>{me.name.slice(0, 1)}</span>
              <span className={styles.who}>
                <b>{me.name}</b>
              </span>
            </span>
          )}
        </div>
      )}
    </aside>
  )
}

/** 패널 맨 위 제목 */
export function SidebarTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>
}

export function SidebarSectionLabel({ children }: { children: ReactNode }) {
  return <p className={styles.sectionLabel}>{children}</p>
}

export function SidebarList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className={styles.list} role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  )
}

/** 패널 상단의 "+ 새 프로젝트" 버튼 */
export function SidebarCreateButton({ onClick, children = '새 프로젝트' }: { onClick?: () => void; children?: ReactNode }) {
  const nav = useProjectNav()
  return (
    <Button variant="tonal" size="xs" icon="plusSm" fullWidth className={styles.create} onClick={onClick ?? nav?.onCreateProject}>
      {children}
    </Button>
  )
}

/* ---------- 프로젝트 내부(평가 단계) 사이드바 ---------- */

type ProjectSidebarProps = {
  user?: User
  /** 생략하면 App이 알려주는 지금 프로젝트 값 (아래 host · questionSet · 프롬프트도 같음) */
  projectName?: string
  /** 평가 대상 서비스 주소 (프로젝트 이름 아래 작은 글씨) */
  host?: string
  /** promptVersions를 주면 쓰지 않음 */
  promptOptions?: SelectOption[]
  promptValue?: string
  onPromptChange?: (value: string) => void
  /** 시험지 상태 (예: "없음", "v1 · 67문항") */
  questionSet?: string
  /** 지금 보고 있는 화면 경로 (routes.ts) */
  current?: string
  /** 이 단계(1~3)까지 진행 가능. 이후는 잠금. 기본값은 현재 단계 */
  unlockedUntil?: number
  /** 프로젝트 설정 화면. 단계 강조 대신 설정 메뉴를 강조 */
  settingsActive?: boolean
  /** 단계 번호(1~3)별 작은 글씨 (예: { 1: 'v1 · 67문항 확정' }) */
  stageNotes?: Partial<Record<number, string>>
  /** 없으면 프로젝트 목록(#/projects)으로 이동 */
  onBack?: () => void
  /** 없으면 그 화면으로 이동 */
  onSelect?: (route: string) => void
  /** 없으면 프로젝트 설정 화면으로 이동 */
  onSettings?: () => void
  onProjectClick?: () => void
  /** 주면 프롬프트 칸이 버전 기록 팝오버로 바뀝니다. 최신 버전이 맨 앞 */
  promptVersions?: PromptVersion[]
  /** 없으면 프로젝트 설정(프롬프트)으로 이동 */
  onCreateVersion?: () => void
  /** 없으면 오답 노트로 이동 */
  onShowVersionHistory?: () => void
  userMenu?: UserMenuActions
}

export function ProjectSidebar({
  user,
  projectName: projectNameProp,
  host: hostProp,
  promptOptions: promptOptionsProp,
  promptValue: promptValueProp,
  onPromptChange = () => {},
  questionSet: questionSetProp,
  current,
  unlockedUntil,
  settingsActive,
  stageNotes,
  onBack,
  onSelect,
  onSettings,
  onProjectClick,
  promptVersions,
  onCreateVersion,
  onShowVersionHistory,
  userMenu,
}: ProjectSidebarProps) {
  const nav = useProjectNav()
  const summary = nav?.current
  const projectName = projectNameProp ?? summary?.name ?? ''
  const host = hostProp ?? summary?.host
  const questionSet = questionSetProp ?? summary?.questionSet ?? '없음'
  // 화면이 프롬프트 칸을 정하지 않으면 최신 버전만 보여줌
  const promptOptions = promptOptionsProp ?? (promptVersions ? undefined : summary?.promptLabel ? [{ value: 'latest', label: `${summary.promptLabel} (최신)` }] : [])
  const promptValue = promptValueProp ?? 'latest'
  // 프로젝트 목록을 App이 내려줄 때만 프로젝트 전환 팝오버를 씀
  const projectSwitch: ProjectSwitchOptions | undefined = nav
    ? {
        projects: nav.projects,
        currentId: summary?.id ?? nav.projects.find((p) => p.name === projectName)?.id,
        onSelect: (project) => (nav.onOpenProject ? nav.onOpenProject(project) : goTo(stageRoute(project.currentStep))),
        onCreate: nav.onCreateProject,
        onShowAll: () => goTo(ROUTES.projects),
      }
    : undefined
  const stage = (current && stageOf(current)) || 1
  // 화면이 정한 값 · 프로젝트에서 이미 연 단계 · 지금 단계 중 가장 큰 값까지 열림
  const reach = Math.max(stage, unlockedUntil ?? stage, nav?.unlockedStage ?? 0, summary?.unlockedStage ?? 0)

  return (
    <Sidebar
      active="projects"
      user={user}
      userMenu={userMenu}
      panelFooter={
        <NavItem
          icon="settingsSm"
          label="프로젝트 설정"
          active={settingsActive}
          onClick={onSettings ?? (() => goTo(ROUTES.projectSettings))}
        />
      }
    >
      <button type="button" className={styles.back} onClick={onBack ?? (() => goTo(ROUTES.projects))}>
        <Icon name="arrowLeft" />
        전체 프로젝트
      </button>
      <ProjectSelector
        projectName={projectName}
        host={host}
        promptOptions={promptOptions}
        promptValue={promptValue}
        onPromptChange={onPromptChange}
        questionSet={questionSet}
        onProjectClick={onProjectClick}
        projectSwitch={projectSwitch}
        promptVersions={
          promptVersions && {
            versions: promptVersions,
            onCreate: onCreateVersion ?? (() => goTo(ROUTES.projectSettings)),
            onShowHistory: onShowVersionHistory ?? (() => goTo(ROUTES.wrongNotes)),
          }
        }
      />
      <SidebarSectionLabel>평가 단계</SidebarSectionLabel>
      <StageList
        stages={STAGES}
        current={stage}
        currentRoute={settingsActive ? undefined : current}
        unlockedUntil={reach}
        notes={stageNotes}
        onSelect={onSelect ?? goTo}
      />
    </Sidebar>
  )
}
