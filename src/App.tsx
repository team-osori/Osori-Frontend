import { useState } from 'react'
import type { HomeMenu, UserMenuActions } from './components/common'
import { buildProject, CreateProjectModal, type NewProject } from './features/project'
import { MOCK_MEMBERS, type Member } from './features/settings'
import { useHashRoute } from './hooks/useHashRoute'
import AbRunPage from './pages/AbRunPage'
import ConnectionSetupPage from './pages/ConnectionSetupPage'
import { LoginPage } from './pages/Login'
import { MOCK_INSTANCE_VERSION, MOCK_PROJECTS, MOCK_USER, ProjectListPage } from './pages/ProjectList'
import QuestionSetPage from './pages/QuestionSetPage'
import { SettingsPage } from './pages/Settings'
import { SignupPage } from './pages/Signup'
import type { Project } from './types/project'

export default function App() {
  const [route, navigate] = useHashRoute('/login')
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS)
  const [createOpen, setCreateOpen] = useState(false)

  // TODO: 프로젝트 API 연동. 지금은 화면 안에서만 추가하고 평가 1단계(연결 설정)로 이동
  function createProject(input: NewProject) {
    setProjects((prev) => [buildProject(input), ...prev])
    setCreateOpen(false)
    navigate('/connection')
  }

  /** 홈 사이드바 메뉴 이동. 휴지통은 아직 화면이 없음 */
  function navigateHome(menu: HomeMenu) {
    if (menu === 'create') setCreateOpen(true)
    else if (menu === 'projects') navigate('/projects')
    else if (menu === 'settings') navigate('/settings')
  }

  // TODO: 로그아웃 시 세션 정리 (인증 API 연동 후)
  const userMenu: UserMenuActions = {
    instanceVersion: MOCK_INSTANCE_VERSION,
    onAccountSettings: () => navigate('/settings'),
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
      case '/settings':
        return (
          <SettingsPage
            user={MOCK_USER}
            projectCount={projects.length}
            members={members}
            onMembersChange={setMembers}
            onNavigate={navigateHome}
            userMenu={userMenu}
          />
        )
      // API 연동 전, 로그인 오류 상태(11)를 확인하기 위한 경로
      case '/login/error':
        return <LoginPage initialEmail={MOCK_USER.email} initialError="비밀번호가 일치하지 않습니다." />
      case '/signup':
        return <SignupPage onSignup={() => navigate('/login')} />
      // 평가 1~3단계
      case '/connection':
        return (
          <ConnectionSetupPage onBack={() => navigate('/projects')} onSaveAndNext={() => navigate('/questions')} />
        )
      case '/questions':
        return <QuestionSetPage onBack={() => navigate('/projects')} onConfirm={() => navigate('/ab-run')} />
      case '/ab-run':
        return <AbRunPage onBack={() => navigate('/projects')} />
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
