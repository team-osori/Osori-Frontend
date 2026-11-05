import { useHashRoute } from './hooks/useHashRoute'
import { LoginPage } from './pages/Login'
import { MOCK_PROJECTS, MOCK_USER, ProjectListPage } from './pages/ProjectList'
import { SignupPage } from './pages/Signup'

export default function App() {
  const [route, navigate] = useHashRoute('/login')

  switch (route) {
    case '/projects':
      return <ProjectListPage user={MOCK_USER} projects={MOCK_PROJECTS} />
    // API 연동 전, 프로젝트가 없는 상태(02-1)를 확인하기 위한 경로
    case '/projects/empty':
      return <ProjectListPage user={MOCK_USER} projects={[]} />
    // API 연동 전, 로그인 오류 상태(11)를 확인하기 위한 경로
    case '/login/error':
      return <LoginPage initialEmail={MOCK_USER.email} initialError="비밀번호가 일치하지 않습니다." />
    case '/signup':
      return <SignupPage onSignup={() => navigate('/login')} />
    default:
      return <LoginPage onLogin={() => navigate('/projects')} />
  }
}
