import { useEffect, useState } from 'react'
import { ProjectNavContext, SidebarUserContext, type HomeMenu, type UserMenuActions } from './components/common'
import { useAuth } from './features/auth'
import { buildProject, CreateProjectModal, type NewProject } from './features/project'
import { MOCK_JUDGE_ITEMS } from './features/grading/mock'
import { MOCK_MEMBERS, type Member } from './features/settings'
import { useHashRoute } from './hooks/useHashRoute'
import { errorMessage, isApiError, setSessionExpiredHandler } from './lib/api'
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
import { SignupPage, type SignupErrors } from './pages/Signup'
import { ROUTES, stepRoute } from './routes'
import type { Project } from './types/project'

/** 로그인하지 않아도 볼 수 있는 화면 */
const PUBLIC_ROUTES: string[] = [ROUTES.login, ROUTES.signup, '/login/error']

export default function App() {
  const [route, navigate] = useHashRoute(ROUTES.login)
  const auth = useAuth()
  const isPublic = PUBLIC_ROUTES.includes(route)

  // 로그인하지 않았으면 로그인 화면으로, 로그인했는데 로그인 · 회원가입 화면이면 프로젝트 목록으로
  useEffect(() => {
    if (auth.status === 'signedOut' && !isPublic) navigate(ROUTES.login)
    if (auth.status === 'signedIn' && (route === ROUTES.login || route === ROUTES.signup)) navigate(ROUTES.projects)
  }, [auth.status, isPublic, route, navigate])

  // 토큰 갱신까지 실패하면(로그인 만료) 로그인 화면으로 보냄
  useEffect(() => {
    setSessionExpiredHandler(() => navigate(ROUTES.login))
    return () => setSessionExpiredHandler(null)
  }, [navigate])
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

  const userMenu: UserMenuActions = {
    instanceVersion: MOCK_INSTANCE_VERSION,
    onAccountSettings: () => navigate(ROUTES.accountSettings),
    onLogout: async () => {
      await auth.logout()
      navigate(ROUTES.login)
    },
  }

  // TODO: 역할(어드민 등)은 아직 API에 없어 화면 값을 씀 (#26)
  const currentUser = auth.user ? { ...MOCK_USER, name: auth.user.name, email: auth.user.loginId } : MOCK_USER

  /** 로그인 실패 문구 (비밀번호 칸 아래에 표시) */
  async function login(credentials: { loginId: string; password: string }) {
    try {
      await auth.login(credentials)
      navigate(ROUTES.projects)
    } catch (error) {
      return errorMessage(error, '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  /** 회원가입 후 바로 로그인. 실패하면 칸별 오류를 돌려줌 */
  async function signup(values: { name: string; loginId: string; password: string }): Promise<SignupErrors | void> {
    try {
      await auth.signup(values)
      navigate(ROUTES.projects)
    } catch (error) {
      if (isApiError(error) && error.status === 409) return { loginId: '이미 사용 중인 아이디입니다.' }
      const fields = isApiError(error) ? error.fieldMessages() : {}
      if (Object.keys(fields).length > 0) return fields
      return { passwordConfirm: errorMessage(error, '계정을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.') }
    }
  }

  const listProps = {
    user: currentUser,
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
    // 저장된 토큰으로 로그인 상태를 확인하는 동안, 또는 로그인 화면으로 보내기 직전에는 아무것도 그리지 않음
    if (auth.status === 'checking' || (auth.status === 'signedOut' && !isPublic)) return null
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
            user={currentUser}
            projectCount={projects.length}
            members={members}
            onMembersChange={setMembers}
            onNavigate={navigateHome}
            userMenu={userMenu}
          />
        )
      // API 연동 전, 로그인 오류 상태(11)를 확인하기 위한 경로
      case '/login/error':
        return <LoginPage initialLoginId="kim_qa" initialError="아이디 또는 비밀번호를 확인해 주세요." />
      case ROUTES.signup:
        return <SignupPage onSignup={signup} />

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
        return <LoginPage onLogin={login} />
    }
  }

  return (
    // 평가 화면 사이드바의 프로젝트 전환 팝오버가 이 목록과 만들기 동작을 씀
    <SidebarUserContext.Provider
      value={auth.user ? { name: auth.user.name, account: auth.user.loginId, menu: userMenu } : null}
    >
      <ProjectNavContext.Provider value={{ projects, onCreateProject: () => setCreateOpen(true) }}>
        {renderScreen()}
        <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={createProject} />
      </ProjectNavContext.Provider>
    </SidebarUserContext.Provider>
  )
}
