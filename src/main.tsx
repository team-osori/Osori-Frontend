import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/ui'
import { AuthProvider } from './features/auth'
import { startAppScale } from './lib/appScale'
import './styles/global.css'

// 화면 폭에 맞춰 앱 전체 배율 조정 (src/lib/appScale.ts)
startAppScale()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
