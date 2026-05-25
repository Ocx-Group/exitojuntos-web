import { RuntimeEnvironment } from '@app/core/interfaces/runtime-environment';

const runtimeEnv =
  (globalThis as typeof globalThis & { __env?: RuntimeEnvironment }).__env ??
  {};

export const environment = {
  production: true,
  apiUrl: runtimeEnv.EXITOJUNTOS_API_URL || '',
  google: {
    clientId: runtimeEnv.GOOGLE_CLIENT_ID || '',
  },
};
