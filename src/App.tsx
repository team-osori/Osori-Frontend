import { useHashRoute } from './hooks/useHashRoute'
import { LoginPage } from './pages/Login'
import { MOCK_PROJECTS, MOCK_USER, ProjectListPage } from './pages/ProjectList'

export default function App() {
  const [route, navigate] = useHashRoute('/login')

  switch (route) {
    case '/projects':
      return <ProjectListPage user={MOCK_USER} projects={MOCK_PROJECTS} />
    // API 연동 전, 프로젝트가 없는 상태(02-1)를 확인하기 위한 경로
    case '/projects/empty':
      return <ProjectListPage user={MOCK_USER} projects={[]} />
    default:
      return <LoginPage onLogin={() => navigate('/projects')} />
  }
}
