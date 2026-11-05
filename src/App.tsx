import { useState } from 'react'
import type { HomeMenu, UserMenuActions } from './components/common'
import { buildProject, CreateProjectModal, type NewProject } from './features/project'
import { MOCK_MEMBERS, type Member } from './features/settings'
import { useHashRoute } from './hooks/useHashRoute'
import AbRunPage from './pages/AbRunPage'
import ConnectionSetupPage from './pages/ConnectionSetupPage'
import GradingResultsPage from './pages/GradingResultsPage'
import ImprovementApplyPage from './pages/ImprovementApplyPage'
import { LoginPage } from './pages/Login'
import { MOCK_INSTANCE_VERSION, MOCK_PROJECTS, MOCK_USER, ProjectListPage } from './pages/ProjectList'
import ProjectSettingsPage from './pages/ProjectSettingsPage'
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
    else if (menu === 'settings') navigate('/account-settings')
  }

  // TODO: 로그아웃 시 세션 정리 (인증 API 연동 후)
  const userMenu: UserMenuActions = {
    instanceVersion: MOCK_INSTANCE_VERSION,
    onAccountSettings: () => navigate('/account-settings'),
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
      // 앱 전체 설정 (내 계정 · 멤버 · 인스턴스). /settings는 프로젝트 설정이 쓰고 있음
      case '/account-settings':
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
        return <AbRunPage onBack={() => navigate('/projects')} onShowResults={() => navigate('/grading')} />
      case '/grading':
        return <GradingResultsPage onBack={() => navigate('/projects')} />
      case '/improvement':
        return <ImprovementApplyPage onBack={() => navigate('/projects')} onReevaluate={() => navigate('/grading')} />
      // 프로젝트 설정 (일반 · 서비스 연결 · 채점자 · 멤버)
      case '/settings':
        return <ProjectSettingsPage onBack={() => navigate('/projects')} onDeleted={() => navigate('/projects')} />
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
