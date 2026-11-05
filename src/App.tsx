import { useState } from 'react'
import type { HomeMenu, UserMenuActions } from './components/common'
import { buildProject, CreateProjectModal, type NewProject } from './features/project'
import { useHashRoute } from './hooks/useHashRoute'
import { LoginPage } from './pages/Login'
import { MOCK_INSTANCE_VERSION, MOCK_PROJECTS, MOCK_USER, ProjectListPage } from './pages/ProjectList'
import { SignupPage } from './pages/Signup'
import type { Project } from './types/project'

export default function App() {
  const [route, navigate] = useHashRoute('/login')
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [createOpen, setCreateOpen] = useState(false)

  // TODO: 프로젝트 API 연동. 연결 설정 화면이 생기면 만든 뒤 그리로 이동
  function createProject(input: NewProject) {
    setProjects((prev) => [buildProject(input), ...prev])
    setCreateOpen(false)
    navigate('/projects')
  }

  /** 홈 사이드바 메뉴 이동. 휴지통은 아직 화면이 없음 */
  function navigateHome(menu: HomeMenu) {
    if (menu === 'create') setCreateOpen(true)
    else if (menu === 'projects') navigate('/projects')
  }

  // TODO: 로그아웃 시 세션 정리 (인증 API 연동 후)
  const userMenu: UserMenuActions = {
    instanceVersion: MOCK_INSTANCE_VERSION,
    onLogout: () => navigate('/login'),
  }

  const listProps = {
    user: MOCK_USER,
    onCreateProject: () => setCreateOpen(true),
    onNavigate: navigateHome,
    userMenu,
  }

  function renderScreen() {
    switch (route) {
      case '/projects':
        return <ProjectListPage {...listProps} projects={projects} />
      // API 연동 전, 프로젝트가 없는 상태(02-1)를 확인하기 위한 경로
      case '/projects/empty':
        return <ProjectListPage {...listProps} projects={[]} />
      // API 연동 전, 로그인 오류 상태(11)를 확인하기 위한 경로
      case '/login/error':
        return <LoginPage initialEmail={MOCK_USER.email} initialError="비밀번호가 일치하지 않습니다." />
      case '/signup':
        return <SignupPage onSignup={() => navigate('/login')} />
      default:
        return <LoginPage onLogin={() => navigate('/projects')} />
    }
  }

  return (
    <>
      {renderScreen()}
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={createProject} />
    </>
  )
}
