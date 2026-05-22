import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Country } from '@app/core/models/country-model/country.model';
import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';

import { CountryService } from '@app/core/service/country-service/country.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TermsConditionsComponent } from '@app/shared/components/terms-conditions/terms-conditions.component';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { environment } from '@environments/environment';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdentityConfig) => void;
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
}

interface GoogleProfilePayload {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    TermsConditionsComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  key = '';
  side = '';
  submitted = false;
  error = '';
  sponsor = '';
  user: UserAffiliate = new UserAffiliate();
  listcountry: Country[] = [];
  readonly navbarIcon = 'assets/exito-logo.svg';
  showPassword = false;
  showConfirmPassword = false;
  showTermsModal = false;
  loading = false;
  googleRegistrationActive = false;
  private googleRegistrationToken = '';
  private googleProfilePicture = '';

  // Propiedades para búsqueda manual de patrocinador
  sponsorPhoneInput = '';
  isSearchingSponsor = false;
  sponsorFound = false;
  sponsorSearchError = '';
  isManualSponsor = false;

  // Subject para debounce de búsqueda de patrocinador
  private readonly sponsorPhoneSubject = new Subject<string>();
  private sponsorSearchSubscription: Subscription;
  private readonly countryService: CountryService = inject(CountryService);
  private readonly authService = inject(AuthService);
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly toastr: ToastrService,
    private readonly translate: TranslateService,
  ) {
    this.key = this.activatedRoute.snapshot.params.key || '';
    this.side = this.user.side?.toString() || '';

    if (this.key) {
      this.loadValidations();
      this.getUserByPhone(this.key);
    }

    this.fetchCountry();
  }

  private fetchCountry() {
    this.countryService.getCountries().subscribe({
      next: data => {
        if (data && Array.isArray(data)) {
          this.listcountry = data;
        } else {
          console.error('Invalid countries data:', data);
          this.toastr.warning(
            this.translate.instant('SIGNUP.WARNING_NO_COUNTRIES'),
          );
          this.listcountry = [];
        }
      },
      error: error => {
        console.error('Error loading countries:', error);
        this.toastr.error(
          this.translate.instant('SIGNUP.ERROR_LOADING_COUNTRIES'),
        );
        this.listcountry = [];
      },
    });
  }

  ngOnInit(): void {
    this.loadValidations();
    this.setupSponsorSearchDebounce();
  }

  ngOnDestroy(): void {
    if (this.sponsorSearchSubscription) {
      this.sponsorSearchSubscription.unsubscribe();
    }
  }

  private setupSponsorSearchDebounce(): void {
    this.sponsorSearchSubscription = this.sponsorPhoneSubject
      .pipe(
        debounceTime(1500), // Esperar 1.5 segundos después de que el usuario deje de escribir
        distinctUntilChanged(), // Solo buscar si el valor cambió
        filter(phone => phone.length >= 6), // Solo buscar si tiene al menos 6 dígitos
      )
      .subscribe(phone => {
        this.searchSponsorByPhone(phone);
      });
  }

  onSponsorPhoneChange(value: string): void {
    this.sponsorPhoneInput = value;
    const cleanPhone = this.cleanPhoneNumber(value);

    // Resetear estado si el campo está vacío o muy corto
    if (cleanPhone.length < 6) {
      this.sponsorFound = false;
      this.sponsorSearchError = '';
      this.user = new UserAffiliate();
      return;
    }

    // Emitir el valor para el debounce
    this.sponsorPhoneSubject.next(cleanPhone);
  }

  // Helper function to clean phone number
  private cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    // Remove all + symbols and trim whitespace
    return phone.split('+').join('').trim();
  }

  loadValidations() {
    this.registerForm = this.formBuilder.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/,
            ),
          ],
        ],
        repitpassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/,
            ),
          ],
        ],
        name: ['', Validators.required],
        last_name: ['', Validators.required],
        username: [
          '',
          [
            Validators.required,
            NoWhitespaceValidator,
            Validators.pattern(/^[A-Za-z0-9._-]{3,50}$/),
          ],
        ],
        phone: ['', Validators.required],
        country: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        city: ['', Validators.required],
        state: ['', Validators.required],
        address: [''],
        birtDate: [null],
        terms_conditions: [false, Validators.requiredTrue],
      },
      {
        validators: passwordMatchValidator,
      },
    );
  }

  getUserByPhone(phone: string) {
    if (!phone) return;

    this.authService.getAffiliateByPhone(phone).subscribe({
      next: (user: UserAffiliate) => {
        if (user?.id) {
          this.sponsor = user.phone;
          this.user = user;
        } else {
          this.toastr.error(this.translate.instant('SIGNUP.USER_NOT_FOUND'));
          this.router.navigate(['/signin']).then();
        }
      },
      error: error => {
        console.error('Error fetching user by phone:', error);
        this.toastr.error(this.translate.instant('SIGNUP.ERROR_FETCHING_USER'));
        this.router.navigate(['/signin']).then();
      },
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    if (this.registerForm.invalid) {
      this.showError(this.translate.instant('SIGNUP.INVALID_FORM'));
      return;
    }

    // Validar que haya un patrocinador seleccionado
    if (!this.user?.id) {
      this.showError(this.translate.instant('SIGNUP.SPONSOR_REQUIRED'));
      return;
    }

    const user = new UserAffiliate();
    const cleanPhone = this.cleanPhoneNumber(this.registerForm.value.phone);
    if (!this.googleRegistrationActive) {
      user.password = this.registerForm.value.password;
    }
    user.name = this.registerForm.value.name;
    user.lastName = this.registerForm.value.last_name;
    user.username = this.registerForm.value.username.trim().toLowerCase();
    user.phone = cleanPhone;
    user.countryId = Number(this.registerForm.value.country);
    user.city = this.registerForm.value.city;
    user.state = this.registerForm.value.state;
    user.address = this.registerForm.value.address;
    user.birtDate = this.registerForm.value.birtDate;
    user.email = this.registerForm.value.email;
    user.father = Number(this.user.id);
    user.side = +this.side;
    user.status = true;
    user.termsConditions = this.registerForm.value.terms_conditions;
    user.roleId = 2;
    user.imageProfileUrl = this.googleProfilePicture;

    const registerRequest = this.googleRegistrationActive
      ? this.authService.registerWithGoogle(this.googleRegistrationToken, user)
      : this.authService.createAffiliate(user);

    registerRequest.subscribe({
      next: response => {
        if (response.success) {
          this.showSuccess(response.message);
          if (this.googleRegistrationActive) {
            this.router.navigate(['/app/my-network'], { replaceUrl: true }).then();
            return;
          }

          setTimeout(() => {
            this.router.navigate(['/signin']).then();
          }, 5000);
        } else {
          const errorMessage = this.getErrorMessage(response);
          this.showError(errorMessage);
        }
      },
      error: error => {
        const errorMessage = this.getErrorMessage(error);
        this.showError(errorMessage);
      },
    });
  }

  async startGoogleRegistration(): Promise<void> {
    this.submitted = false;
    this.error = '';
    this.loading = true;

    try {
      const idToken = await this.getGoogleIdentityToken();
      const googleProfile = this.decodeGoogleProfile(idToken);

      this.googleRegistrationToken = idToken;
      this.googleRegistrationActive = true;
      this.googleProfilePicture = googleProfile.picture ?? '';
      this.applyGoogleRegistrationMode();

      this.registerForm.patchValue({
        email: googleProfile.email ?? '',
        name: googleProfile.given_name ?? googleProfile.name ?? '',
        last_name: googleProfile.family_name ?? '',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : this.translate.instant('SIGNUP.GOOGLE_REGISTRATION_ERROR');
      this.showError(message);
    } finally {
      this.loading = false;
    }
  }

  private applyGoogleRegistrationMode(): void {
    const passwordControl = this.registerForm.get('password');
    const repeatPasswordControl = this.registerForm.get('repitpassword');

    passwordControl?.clearValidators();
    repeatPasswordControl?.clearValidators();
    passwordControl?.setValue('');
    repeatPasswordControl?.setValue('');
    passwordControl?.updateValueAndValidity();
    repeatPasswordControl?.updateValueAndValidity();
    this.registerForm.updateValueAndValidity();
  }

  private async getGoogleIdentityToken(): Promise<string> {
    const clientId = environment.google?.clientId;

    if (!clientId) {
      throw new Error('Google Client ID no está configurado');
    }

    await this.loadGoogleIdentityScript();

    return new Promise<string>((resolve, reject) => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: response => {
          if (response.credential) {
            resolve(response.credential);
            return;
          }

          reject(new Error('No se recibió credencial de Google'));
        },
      });

      window.google?.accounts.id.prompt(notification => {
        if (notification.isNotDisplayed()) {
          reject(
            new Error(
              `Google Sign-In no se pudo mostrar: ${notification.getNotDisplayedReason()}`,
            ),
          );
        }

        if (notification.isSkippedMoment()) {
          reject(
            new Error(
              `Google Sign-In fue cancelado: ${notification.getSkippedReason()}`,
            ),
          );
        }
      });
    });
  }

  private loadGoogleIdentityScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () =>
          reject(new Error('No se pudo cargar Google Sign-In')),
        );
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('No se pudo cargar Google Sign-In'));

      document.head.appendChild(script);
    });
  }

  private decodeGoogleProfile(idToken: string): GoogleProfilePayload {
    const [, encodedPayload] = idToken.split('.');
    if (!encodedPayload) {
      return {};
    }

    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '=',
      );
      const decodedProfile: unknown = JSON.parse(atob(padded));
      return decodedProfile as GoogleProfilePayload;
    } catch {
      return {};
    }
  }

  showSuccess(message: string) {
    this.toastr.success(message);
  }

  showError(message: string) {
    this.toastr.error(message);
  }

  private getErrorMessage(error: unknown): string {
    const parsedError = this.parseError(error);
    const statusCode = parsedError.code ?? parsedError.status;

    // Intentar extraer el mensaje de diferentes ubicaciones posibles
    let message = '';
    if (
      parsedError.error &&
      typeof parsedError.error === 'object' &&
      parsedError.error.message
    ) {
      message = parsedError.error.message;
    } else if (
      parsedError.message &&
      !parsedError.message.includes('Http failure')
    ) {
      message = parsedError.message;
    } else if (typeof parsedError.error === 'string') {
      message = parsedError.error;
    }

    // Si el código es 409, es un error de conflicto (duplicado)
    // Detectar por palabras clave en el mensaje del backend
    if (statusCode === 409) {
      const normalizedMessage = this.normalizeText(message);

      if (
        normalizedMessage.includes('usuario') ||
        normalizedMessage.includes('username') ||
        normalizedMessage.includes('user name') ||
        normalizedMessage.includes('nombre de usuario')
      ) {
        return this.translate.instant('SIGNUP.USERNAME_ALREADY_REGISTERED');
      }

      // Detectar si es teléfono
      if (
        normalizedMessage.includes('telefono') ||
        normalizedMessage.includes('phone') ||
        normalizedMessage.includes('telephone')
      ) {
        return this.translate.instant('SIGNUP.PHONE_ALREADY_REGISTERED');
      }

      // Detectar si es email
      if (
        normalizedMessage.includes('correo') ||
        normalizedMessage.includes('email') ||
        normalizedMessage.includes('e-mail') ||
        normalizedMessage.includes('mail')
      ) {
        return this.translate.instant('SIGNUP.EMAIL_ALREADY_REGISTERED');
      }
    }

    // Si hay un mensaje del backend y no se pudo traducir, usarlo
    if (message) {
      return message;
    }

    // Mensaje genérico
    return this.translate.instant('SIGNUP.REGISTRATION_ERROR');
  }

  private parseError(error: unknown): {
    code?: number;
    status?: number;
    message?: string;
    error?: string | { message?: string };
  } {
    if (!error || typeof error !== 'object') {
      return {};
    }

    return error as {
      code?: number;
      status?: number;
      message?: string;
      error?: string | { message?: string };
    };
  }

  private normalizeText(text: string): string {
    if (!text) return '';
    return (
      text
        .toLowerCase()
        .normalize('NFD')
        // eslint-disable-next-line unicorn/prefer-string-replace-all -- replaceAll not available on all targeted browsers
        .replace(/[\u0300-\u036f]/g, '')
        // eslint-disable-next-line unicorn/prefer-string-replace-all -- replaceAll not available on all targeted browsers
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
    );
  }

  showTermsAndConditions() {
    // Mostrar el modal de términos y condiciones
    this.showTermsModal = true;
  }

  closeTermsModal() {
    this.showTermsModal = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  searchSponsor() {
    const phone = this.cleanPhoneNumber(this.sponsorPhoneInput);

    if (!phone) {
      this.sponsorSearchError = this.translate.instant(
        'SIGNUP.SPONSOR_PHONE_REQUIRED',
      );
      this.sponsorFound = false;
      return;
    }

    this.searchSponsorByPhone(phone);
  }

  private searchSponsorByPhone(phone: string): void {
    this.isSearchingSponsor = true;
    this.sponsorSearchError = '';
    this.sponsorFound = false;

    this.authService.getAffiliateByPhone(phone).subscribe({
      next: (user: UserAffiliate) => {
        this.isSearchingSponsor = false;
        if (user?.id) {
          this.sponsor = user.phone;
          this.user = user;
          this.sponsorFound = true;
          this.isManualSponsor = true;
          this.sponsorSearchError = '';
        } else {
          this.sponsorSearchError = this.translate.instant(
            'SIGNUP.SPONSOR_NOT_FOUND',
          );
          this.sponsorFound = false;
          this.user = new UserAffiliate();
        }
      },
      error: () => {
        this.isSearchingSponsor = false;
        this.sponsorSearchError = this.translate.instant(
          'SIGNUP.SPONSOR_NOT_FOUND',
        );
        this.sponsorFound = false;
        this.user = new UserAffiliate();
      },
    });
  }
}

// Validador para comparar contraseñas a nivel de formulario
export function passwordMatchValidator(formGroup: FormGroup) {
  const password = formGroup.get('password').value;
  const confirmPassword = formGroup.get('repitpassword').value;
  if (!password && !confirmPassword) {
    return null;
  }
  return password === confirmPassword ? null : { passwordMismatch: true };
}

// Validador para evitar espacios en blanco en el User name
export function NoWhitespaceValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (String(control.value ?? '').includes(' ')) {
    return { whitespace: true };
  } else {
    return null;
  }
}
