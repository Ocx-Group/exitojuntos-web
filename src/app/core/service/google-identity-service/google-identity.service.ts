import { Injectable, NgZone, inject } from '@angular/core';

export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleIdentityConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

export interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  type?: 'standard' | 'icon';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  locale?: string;
}

interface GoogleIdentityNamespace {
  accounts: {
    id: {
      initialize: (config: GoogleIdentityConfig) => void;
      renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
      cancel: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityNamespace;
  }
  // eslint-disable-next-line no-var
  var google: GoogleIdentityNamespace | undefined;
}

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_LOAD_ERROR = 'No se pudo cargar Google Sign-In';

export interface RenderGoogleButtonOptions {
  container: HTMLElement;
  clientId: string;
  buttonConfig: GoogleButtonConfig;
  onCredential: (response: GoogleCredentialResponse) => void;
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly ngZone = inject(NgZone);

  async renderButton(options: RenderGoogleButtonOptions): Promise<void> {
    await this.loadScript();

    globalThis.google?.accounts.id.initialize({
      client_id: options.clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: response => {
        this.ngZone.run(() => options.onCredential(response));
      },
    });

    options.container.innerHTML = '';
    globalThis.google?.accounts.id.renderButton(
      options.container,
      options.buttonConfig,
    );
  }

  private loadScript(): Promise<void> {
    if (globalThis.google?.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${GOOGLE_SCRIPT_SRC}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () =>
          reject(new Error(GOOGLE_LOAD_ERROR)),
        );
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(GOOGLE_LOAD_ERROR));

      document.head.appendChild(script);
    });
  }
}
