import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 백엔드 주소는 공개 저장소에 두지 않고 .env.local(커밋 안 함)에서 읽습니다.
  const target = loadEnv(mode, process.cwd(), '').VITE_API_PROXY_TARGET
  if (!target) console.warn('[vite] VITE_API_PROXY_TARGET이 없어 /api 프록시를 켜지 않습니다. .env.example을 참고하세요.')

  return {
    plugins: [react()],
    server: {
      proxy: target
        ? {
            // 백엔드 CORS가 허용하는 출처가 정해져 있어서, 개발 중에는 같은 출처(/api)로 보내고 여기서 넘깁니다.
            '/api': {
              target,
              changeOrigin: true,
              // 브라우저 출처가 허용 목록에 없어도 거절되지 않도록 Origin을 지우고 보냄
              configure: (proxy) => {
                proxy.on('proxyReq', (req) => req.removeHeader('origin'))
              },
            },
          }
        : undefined,
    },
  }
})
