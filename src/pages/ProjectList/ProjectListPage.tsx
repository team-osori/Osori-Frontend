import { useMemo, useState } from 'react'
import {
  EmptyState,
  NavItem,
  PageHeader,
  PROJECT_STATUS_LABEL,
  ProjectTable,
  Sidebar,
  SidebarCreateButton,
  SidebarList,
  SidebarSectionLabel,
  SidebarTitle,
  type HomeMenu,
  type ProjectStatus,
  type UserMenuActions,
} from '../../components/common'
import { Button, SearchInput, Sticker } from '../../components/ui'
import { AppLayout } from '../../layouts/AppLayout'
import type { CurrentUser, Project } from '../../types/project'
import { Onboarding } from './Onboarding'
import styles from './ProjectListPage.module.css'

type StatusFilter = 'all' | ProjectStatus

const FILTERS: StatusFilter[] = ['all', 'running', 'done', 'setup']

/** 최근 평가순. 평가 기록이 없는 프로젝트는 맨 뒤로 */
function byRecent(a: Project, b: Project) {
  return (b.lastEvaluatedAt ?? '').localeCompare(a.lastEvaluatedAt ?? '')
}

type ProjectListPageProps = {
  user: CurrentUser
  projects: Project[]
  /** 헤더 · 패널 · 빈 상태의 "새 프로젝트" 버튼 */
  onCreateProject?: () => void
  onOpenProject?: (project: Project) => void
  /** 레일 메뉴 이동 (휴지통 · 설정 포함) */
  onNavigate?: (menu: HomeMenu) => void
  userMenu?: UserMenuActions
}

/** 02 프로젝트 목록 · 02-1 빈 상태 */
export function ProjectListPage({ user, projects, onCreateProject, onOpenProject, onNavigate, userMenu }: ProjectListPageProps) {
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: projects.length, running: 0, done: 0, setup: 0 }
    for (const p of projects) c[p.status] += 1
    return c
  }, [projects])

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    return projects
      .filter((p) => filter === 'all' || p.status === filter)
      .filter((p) => !query || p.name.toLowerCase().includes(query) || p.host.toLowerCase().includes(query))
      .sort(byRecent)
  }, [projects, keyword, filter])

  return (
    <AppLayout
      sidebar={
        <Sidebar active="projects" user={user} userMenu={userMenu} onNavigate={onNavigate}>
          <SidebarTitle>프로젝트</SidebarTitle>
          <SidebarCreateButton onClick={onCreateProject} />
          <SidebarSectionLabel>상태</SidebarSectionLabel>
          <SidebarList label="상태 필터">
            {FILTERS.map((f) => (
              <NavItem
                key={f}
                dot={f}
                label={f === 'all' ? '전체' : PROJECT_STATUS_LABEL[f]}
                count={counts[f]}
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </SidebarList>
        </Sidebar>
      }
    >
      <div className={styles.page}>
        <PageHeader
          title="전체 프로젝트"
          count={projects.length}
          actions={
            projects.length > 0 && (
              <>
                <SearchInput
                  size="sm"
                  placeholder="프로젝트 검색"
                  className={styles.search}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button size="xs" icon="plusSm" onClick={onCreateProject}>
                  새 프로젝트
                </Button>
              </>
            )
          }
        />

        {projects.length === 0 ? (
          <Onboarding onCreateProject={onCreateProject} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="search"
            title="조건에 맞는 프로젝트가 없습니다"
            description={keyword.trim() ? `'${keyword.trim()}'와 일치하는 프로젝트가 없습니다.` : '다른 상태를 골라 보세요.'}
          />
        ) : (
          <ProjectTable
            rows={visible}
            onOpen={(row) => {
              const project = projects.find((p) => p.id === row.id)
              if (project) onOpenProject?.(project)
            }}
          />
        )}

        <Sticker name="paperclipLime" width={92} motion="sway" rot={-58} className={styles.clip} />
      </div>
    </AppLayout>
  )
}
