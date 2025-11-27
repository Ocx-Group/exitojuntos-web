import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Response } from '@app/core/models/response-model/response.model';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/service/authentication-service/auth.service';
import { CommonModule } from '@angular/common';
import { Signin } from '@app/core/models/signin-model/signin.model';
import { LogoService } from '@app/core/service/logo-service/logo.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
})
export class SigninComponent implements OnInit {
  submitted = false;
  error = '';
  loading = false;
  hide = true;
  logoUrl: string;
  phone: string = 'Teléfono';
  password: string = 'Contraseña';
  remember: string = 'Recordar';
  forgot: string = 'Cambiar contraseña';
  signin: string = 'Iniciar sesión';
  passwordIsRequerid = 'La contraseña es requerida.';
  userNameIsRequerid = 'El usuario es requerido.';
  passwordErrorMessage =
    'La contraseña debe tener al menos 6 y un máximo de 15 caracteres';
  userNameErrorMessage = 'El nombre de usuario no es válido';
  showPassword: boolean = false;
  readonly navbarIcon = 'assets/exito-logo.svg';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastr: ToastrService,
    private readonly logoService: LogoService,
    private readonly translate: TranslateService,
    private readonly deviceService: DeviceDetectorService,
  ) {}

  ngOnInit() {
    // Verificar si el usuario ya está logueado usando signals
    if (this.authService.isLoggedIn()) {
      this.redirectByRole(this.authService.userAffiliate()?.role?.name);
      return;
    }

    this.getTheme();
    this.setLabels();
    this.setErrorMessages();

    // Suscribirse a cambios de idioma
    this.translate.onLangChange.subscribe(() => {
      this.setLabels();
      this.setErrorMessages();
    });
  }

  authLogin = new FormGroup({
    remeber: new FormControl('', []),
    phone: new FormControl('', [Validators.required]),
    pwd: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(15),
    ]),
  });

  setLabels() {
    if (this.translate.getCurrentLang() != undefined) {
      this.phone = this.translate.instant('SIGNIN.PHONE.TEXT');
      this.password = this.translate.instant('SIGNIN.PASSWORD.TEXT');
      this.remember = this.translate.instant('SIGNIN.REMEMBER-ME.TEXT');
      this.forgot = this.translate.instant('SIGNIN.FORGOT-PASS.TEXT');
      this.signin = this.translate.instant('SIGNIN.TITLE.TEXT');
    }
  }

  setErrorMessages() {
    if (this.translate.getCurrentLang() != undefined) {
      this.passwordIsRequerid = this.translate.instant(
        'SIGNIN.PASS-IS-REQUIRED.TEXT',
      );
      this.userNameIsRequerid = this.translate.instant(
        'SIGNIN.USER-NAME-IS-REQUIRED.TEXT',
      );
      this.passwordErrorMessage = this.translate.instant(
        'SIGNIN.PASS-MESSAGE-ERROR.TEXT',
      );
      this.userNameErrorMessage = this.translate.instant(
        'SIGNIN.USER-NAME-MESSAGE-ERROR.TEXT',
      );
    }
  }

  loginSubmitted() {
    const signin = new Signin();
    this.submitted = true;
    this.error = '';

    if (this.authLogin.invalid) {
      return;
    }

    signin.phone = this.authLogin.value.phone ?? '';
    signin.password = this.authLogin.value.pwd ?? '';
    this.loading = true;

    this.authService
      .loginUser(signin)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: Response) => {
          if (response.success) {
            // Verificar si el usuario está verificado (status === true)
            if (response.data.user?.status !== true) {
              const message = this.getLocalizedText(
                'SIGNIN.ACCOUNT_NOT_VERIFIED',
                'Tu cuenta no está verificada. Por favor, verifica tu correo electrónico para activar tu cuenta.',
              );
              this.displayLoginError(message);
              return;
            }

            const roleName = response.data.user?.role?.name?.toLowerCase();

            queueMicrotask(() => {
              this.redirectByRole(roleName);
            });
          } else {
            const message = this.resolveErrorMessage(response);
            this.displayLoginError(message);
          }
        },
        error: error => {
          const message = this.resolveErrorMessage(error);
          this.displayLoginError(message);
        },
      });
  }

  showSuccess(message: string) {
    this.toastr.success(message, 'Success!');
  }

  showError(message: string) {
    this.toastr.error(message, 'Error!');
  }

  private displayLoginError(message: string) {
    this.error = message;
    this.showError(message);
  }

  private resolveErrorMessage(error: unknown): string {
    const statusCode = this.extractStatusCode(error);
    const codeKey = this.mapStatusCodeToKey(statusCode);

    if (codeKey) {
      return this.getLocalizedText(codeKey, this.getFallbackForKey(codeKey));
    }

    const backendMessage = this.extractMessage(error);
    const backendKey = this.mapBackendMessageToKey(backendMessage);

    if (backendKey) {
      return this.getLocalizedText(
        backendKey,
        this.getFallbackForKey(backendKey),
      );
    }

    if (backendMessage) {
      return backendMessage;
    }

    return this.getLocalizedText(
      'SIGNIN.GENERIC_ERROR',
      this.getFallbackForKey('SIGNIN.GENERIC_ERROR'),
    );
  }

  private extractMessage(error: unknown): string {
    if (!error) {
      return '';
    }

    if (typeof error === 'string') {
      return error;
    }

    const anyError = error as {
      message?: string;
      error?: { message?: string };
    };
    return anyError?.message || anyError?.error?.message || '';
  }

  private extractStatusCode(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    const anyError = error as { code?: number; status?: number };
    return anyError.code ?? anyError.status;
  }

  private mapStatusCodeToKey(code?: number): string | null {
    if (!code) {
      return null;
    }

    if (code === 401) {
      return 'SIGNIN.INVALID_CREDENTIALS';
    }

    return null;
  }

  private mapBackendMessageToKey(message: string): string | null {
    if (!message) {
      return null;
    }

    const normalized = this.normalizeText(message);
    const backendMatches: Record<string, string> = {
      'credenciales invalidas': 'SIGNIN.INVALID_CREDENTIALS',
      'credencial invalida': 'SIGNIN.INVALID_CREDENTIALS',
      'invalid credentials': 'SIGNIN.INVALID_CREDENTIALS',
      'usuario o contrasena incorrectos': 'SIGNIN.INVALID_CREDENTIALS',
    };

    return backendMatches[normalized] || null;
  }

  private normalizeText(value: string): string {
    const combiningMarksRegex = /[\u0300-\u036f]/g;

    return (
      value
        .toLowerCase()
        .normalize('NFD')
        // eslint-disable-next-line unicorn/prefer-string-replace-all -- replaceAll not available on all targeted browsers
        .replace(combiningMarksRegex, '')
    );
  }

  private getFallbackForKey(key: string): string {
    const fallbacks: Record<string, string> = {
      'SIGNIN.INVALID_CREDENTIALS':
        'Credenciales inválidas. Verifica tu usuario y contraseña.',
      'SIGNIN.GENERIC_ERROR':
        'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.',
      'SIGNIN.ACCOUNT_NOT_VERIFIED':
        'Tu cuenta no está verificada. Por favor, verifica tu correo electrónico para activar tu cuenta.',
    };

    return fallbacks[key] || '';
  }

  private getLocalizedText(key: string, fallback: string): string {
    const translated = this.translate.instant(key);
    return translated === key ? fallback : translated;
  }

  get f() {
    return this.authLogin.controls;
  }

  get Phone(): FormControl {
    return this.authLogin.get('phone') as FormControl;
  }

  get Pwd(): FormControl {
    return this.authLogin.get('pwd') as FormControl;
  }

  getTheme() {
    this.logoUrl = this.logoService.getLogoSrc();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private redirectByRole(roleName?: string | null): void {
    const normalizedRole = roleName?.toLowerCase();
    const targetRoute =
      normalizedRole === 'admin'
        ? '/admin/users-management'
        : '/app/my-network';

    // Navegar con replaceUrl para evitar que el usuario pueda volver al login con el botón atrás
    this.router.navigate([targetRoute], { replaceUrl: true }).then(
      success => {
        if (!success) {
          console.error('Navigation failed, retrying...');
          // Si la navegación falla, intentar de nuevo
          setTimeout(() => {
            this.router.navigate([targetRoute], { replaceUrl: true });
          }, 500);
        }
      },
      error => {
        console.error('Navigation error:', error);
      },
    );
  }
}
