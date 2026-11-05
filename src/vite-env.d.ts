/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 주소. 비우면 같은 출처의 /api (개발 서버 프록시) */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
