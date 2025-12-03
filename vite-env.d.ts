// Manually define ImportMetaEnv to support import.meta.env usage
interface ImportMetaEnv {
  readonly VITE_GAS_URL?: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
