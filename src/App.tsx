import { useHashRoute } from './hooks/useHashRoute'
import { LoginPage } from './pages/Login'
import { MOCK_PROJECTS, MOCK_USER, ProjectListPage } from './pages/ProjectList'
import ConnectionSetupPage from './pages/ConnectionSetupPage'
import QuestionSetPage from './pages/QuestionSetPage'
import AbRunPage from './pages/AbRunPage'

export default function App() {
  const [route, navigate] = useHashRoute('/login')

  switch (route) {
    case '/projects':
      return <ProjectListPage user={MOCK_USER} projects={MOCK_PROJECTS} />
    // API 연동 전, 프로젝트가 없는 상태(02-1)를 확인하기 위한 경로
    case '/projects/empty':
      return <ProjectListPage user={MOCK_USER} projects={[]} />
    // 평가 1~3단계
    case '/connection':
      return <ConnectionSetupPage onBack={() => navigate('/projects')} onSaveAndNext={() => navigate('/questions')} />
    case '/questions':
      return <QuestionSetPage onBack={() => navigate('/projects')} onConfirm={() => navigate('/ab-run')} />
    case '/ab-run':
      return <AbRunPage onBack={() => navigate('/projects')} />
    default:
      return <LoginPage onLogin={() => navigate('/projects')} />
  }
}
