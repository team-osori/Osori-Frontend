import { useState } from 'react'
import { ProjectNavContext, type HomeMenu, type UserMenuActions } from './components/common'
import { buildProject, CreateProjectModal, type NewProject } from './features/project'
import { MOCK_JUDGE_ITEMS } from './features/grading/mock'
import { MOCK_MEMBERS, type Member } from './features/settings'
import { useHashRoute } from './hooks/useHashRoute'
import AbRunPage from './pages/AbRunPage'
import CauseDiagnosisPage from './pages/CauseDiagnosisPage'
import ConnectionSetupPage from './pages/ConnectionSetupPage'
import GradingResultsPage from './pages/GradingResultsPage'
import HumanJudgePage from './pages/HumanJudgePage'
import ImprovementApplyPage from './pages/ImprovementApplyPage'
import { LoginPage } from './pages/Login'
import { MOCK_INSTANCE_VERSION, MOCK_PROJECTS, MOCK_USER, ProjectListPage } from './pages/ProjectList'
import ProjectSettingsPage from './pages/ProjectSettingsPage'
import QuestionSetPage from './pages/QuestionSetPage'
import { SettingsPage } from './pages/Settings'
import { SignupPage } from './pages/Signup'
import { ROUTES, stepRoute } from './routes'
import type { Project } from './types/project'

export default function App() {
  const [route, navigate] = useHashRoute(ROUTES.login)
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS)
  const [createOpen, setCreateOpen] = useState(false)
  // 사람 판정 화면을 열 때 먼저 보여줄 문항 (06 불안정 문항 패널에서 고른 문항)
  const [judgeStartId, setJudgeStartId] = useState<string>()

  // TODO: 프로젝트 API 연동. 지금은 화면 안에서만 추가하고 평가 1단계(연결 설정)로 이동
  function createProject(input: NewProject) {
    setProjects((prev) => [buildProject(input), ...prev])
    setCreateOpen(false)
    navigate(stepRoute(1) ?? ROUTES.projects)
  }

  /** 프로젝트 카드 버튼: 그 프로젝트가 진행 중인 단계의 화면을 엽니다. */
  function openProject(project: Project) {
    navigate(stepRoute(project.currentStep) ?? ROUTES.projects)
  }

  /** 홈 사이드바 메뉴 이동. 휴지통은 아직 화면이 없음 */
  function navigateHome(menu: HomeMenu) {
    if (menu === 'create') setCreateOpen(true)
    else if (menu === 'projects') navigate(ROUTES.projects)
    else if (menu === 'settings') navigate(ROUTES.accountSettings)
  }

  // TODO: 로그아웃 시 세션 정리 (인증 API 연동 후)
  const userMenu: UserMenuActions = {
    instanceVersion: MOCK_INSTANCE_VERSION,
    onAccountSettings: () => navigate(ROUTES.accountSettings),
    onLogout: () => navigate(ROUTES.login),
  }

  const listProps = {
    user: MOCK_USER,
    onCreateProject: () => setCreateOpen(true),
    onOpenProject: openProject,
    onNavigate: navigateHome,
    userMenu,
  }

  /** 06 불안정 문항에서 "판정하기"를 누르면 같은 질문의 사람 판정 항목부터 시작 */
  function judgeFrom(question?: string) {
    setJudgeStartId(question ? MOCK_JUDGE_ITEMS.find((i) => i.question === question)?.id : undefined)
    navigate(stepRoute(5) ?? ROUTES.projects)
  }

  function renderScreen() {
    switch (route) {
      case ROUTES.projects:
        return <ProjectListPage {...listProps} projects={projects} />
      // API 연동 전, 프로젝트가 없는 상태(02-1)를 확인하기 위한 경로
      case '/projects/empty':
        return <ProjectListPage {...listProps} projects={[]} />
      // 앱 전체 설정 (내 계정 · 멤버 · 인스턴스). /settings는 프로젝트 설정이 쓰고 있음
      case ROUTES.accountSettings:
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
      case ROUTES.signup:
        return <SignupPage onSignup={() => navigate(ROUTES.login)} />

      // 평가 1~7단계. 사이드바의 단계 · 프로젝트 설정 이동은 ProjectSidebar가 직접 처리합니다.
      case stepRoute(1):
        return <ConnectionSetupPage onSaveAndNext={() => navigate(stepRoute(2)!)} />
      case stepRoute(2):
        return <QuestionSetPage onConfirm={() => navigate(stepRoute(3)!)} />
      case stepRoute(3):
        return <AbRunPage onShowResults={() => navigate(stepRoute(4)!)} />
      case stepRoute(4):
        return <GradingResultsPage onJudge={(item) => judgeFrom(item?.question)} />
      case stepRoute(5):
        return <HumanJudgePage key={judgeStartId} initialId={judgeStartId} onFinish={() => navigate(stepRoute(6)!)} />
      case stepRoute(6):
        return <CauseDiagnosisPage onApply={() => navigate(stepRoute(7)!)} />
      case stepRoute(7):
        // 재평가를 실행하면 4단계 결과로 돌아가 새 버전의 결과를 봄
        return <ImprovementApplyPage onReevaluate={() => navigate(stepRoute(4)!)} />

      // 프로젝트 설정 (일반 · 서비스 연결 · 채점자 · 멤버)
      case ROUTES.projectSettings:
        return <ProjectSettingsPage onDeleted={() => navigate(ROUTES.projects)} />
      default:
        return <LoginPage onLogin={() => navigate(ROUTES.projects)} />
    }
  }

  return (
    // 평가 화면 사이드바의 프로젝트 전환 팝오버가 이 목록과 만들기 동작을 씀
    <ProjectNavContext.Provider value={{ projects, onCreateProject: () => setCreateOpen(true) }}>
      {renderScreen()}
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={createProject} />
    </ProjectNavContext.Provider>
  )
}
