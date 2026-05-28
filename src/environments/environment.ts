import { RuntimeEnvironment } from '@app/core/interfaces/runtime-environment';

const runtimeEnv =
  (globalThis as typeof globalThis & { __env?: RuntimeEnvironment }).__env ??
  {};

export const environment = {
  production: false,
  apiUrl:
    runtimeEnv.EXITOJUNTOS_API_URL ||
    'https://exitojuntos-server-lmowi.ondigitalocean.app/v1',
  google: {
    clientId: runtimeEnv.GOOGLE_CLIENT_ID || '',
  },
};
