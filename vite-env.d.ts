// Removed reference to "vite/client" to fix "Cannot find type definition file" error.
// Manually defined ImportMeta and ImportMetaEnv for environment variable typing.

interface ImportMetaEnv {
  readonly VITE_GAS_URL?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
