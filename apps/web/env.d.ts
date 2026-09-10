/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端基址。缺省指向本机 3001 端口 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
