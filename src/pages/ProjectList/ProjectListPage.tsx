import { useMemo, useState } from 'react'
import { EmptyState, HomeSidebar, PageHeader, ProjectCard, ProjectCardGrid } from '../../components/common'
import { Button, Select, type SelectOption } from '../../components/ui'
import { AppLayout } from '../../layouts/AppLayout'
import type { CurrentUser, Project } from '../../types/project'
import styles from './ProjectListPage.module.css'

type SortKey = 'recent' | 'name'

const SORT_OPTIONS: SelectOption[] = [
  { value: 'recent', label: '최근 평가순' },
  { value: 'name', label: '이름순' },
]

function sortProjects(projects: Project[], sort: SortKey) {
  const list = [...projects]
  if (sort === 'name') return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  // 평가 기록이 없는 프로젝트는 맨 뒤로
  return list.sort((a, b) => (b.lastEvaluatedAt ?? '').localeCompare(a.lastEvaluatedAt ?? ''))
}

function metaText(project: Project) {
  if (!project.lastEvaluatedAt) return '평가 기록 없음'
  const version = project.promptVersion != null ? ` · v${project.promptVersion}` : ''
  return `최근 평가 ${project.lastEvaluatedAt}${version}`
}

type ProjectListPageProps = {
  user: CurrentUser
  projects: Project[]
  onCreateProject?: () => void
  onOpenProject?: (project: Project) => void
}

/** 02 프로젝트 목록 */
export function ProjectListPage({ user, projects, onCreateProject, onOpenProject }: ProjectListPageProps) {
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')

  const visibleProjects = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    const matched = query ? projects.filter((p) => p.name.toLowerCase().includes(query)) : projects
    return sortProjects(matched, sort)
  }, [projects, keyword, sort])

  return (
    <AppLayout
      sidebar={
        <HomeSidebar
          user={user}
          projectCount={projects.length}
          onSearch={setKeyword}
          onNavigate={(menu) => menu === 'create' && onCreateProject?.()}
        />
      }
    >
      <div className={styles.page}>
        <PageHeader
          title="전체 프로젝트"
          description="프로젝트 하나에 서비스 하나를 연결해 평가합니다."
          actions={
            <>
              <Select
                size="md"
                align="end"
                ariaLabel="정렬 기준"
                options={SORT_OPTIONS}
                value={sort}
                onChange={(value) => setSort(value as SortKey)}
              />
              <Button size="sm" icon="plusSm" onClick={onCreateProject}>
                프로젝트 만들기
              </Button>
            </>
          }
        />

        {projects.length === 0 ? (
          /* 02-1 빈 상태 */
          <EmptyState
            icon="gridLg"
            title="아직 프로젝트가 없습니다"
            description="연결 설정부터 개선안 적용까지 7단계로 챗봇 프롬프트를 평가합니다."
            action={<Button onClick={onCreateProject}>첫 프로젝트 만들기</Button>}
          />
        ) : visibleProjects.length === 0 ? (
          <EmptyState icon="search" title="검색 결과가 없습니다" description={`'${keyword.trim()}'와 일치하는 프로젝트가 없습니다.`} />
        ) : (
          <ProjectCardGrid>
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                name={project.name}
                meta={metaText(project)}
                status={project.status}
                scores={project.scores}
                progressText={project.progressText}
                onAction={() => onOpenProject?.(project)}
              />
            ))}
          </ProjectCardGrid>
        )}
      </div>
    </AppLayout>
  )
}
