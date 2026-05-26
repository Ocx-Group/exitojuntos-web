import {
  Component,
  OnInit,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Country } from '@app/core/models/country-model/country.model';
import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';

import { CountryService } from '@app/core/service/country-service/country.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TermsConditionsComponent } from '@app/shared/components/terms-conditions/terms-conditions.component';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import {
  GoogleCredentialResponse,
  GoogleIdentityService,
} from '@app/core/service/google-identity-service/google-identity.service';
import {
  NoWhitespaceValidator,
  passwordMatchValidator,
} from './signup.validators';
import {
  GoogleProfilePayload,
  buildGooglePhone,
  buildGoogleUsername,
  cleanPhoneNumber,
  decodeGoogleProfile,
} from './signup.helpers';
import { buildSignupErrorMessage } from './signup-error.handler';

const PASSWORD_PATTERN =
  /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,50}$/;
const SIGNIN_REDIRECT_DELAY_MS = 5000;
const GOOGLE_BUTTON_MAX_WIDTH = 382;

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    TermsConditionsComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupComponent implements OnInit, AfterViewInit {
  registerForm!: FormGroup;
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

  private readonly countryService = inject(CountryService);
  private readonly authService = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);

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
      this.getUserByUsername(this.key);
    }

    this.fetchCountry();
  }

  ngOnInit(): void {
    this.loadValidations();
  }

  ngAfterViewInit(): void {
    void this.initializeGoogleRegisterButton();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.registerForm.controls;
  }

  loadValidations(): void {
    this.registerForm = this.formBuilder.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(PASSWORD_PATTERN),
          ],
        ],
        repitpassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(PASSWORD_PATTERN),
          ],
        ],
        name: ['', Validators.required],
        last_name: ['', Validators.required],
        username: [
          '',
          [
            Validators.required,
            NoWhitespaceValidator,
            Validators.pattern(USERNAME_PATTERN),
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

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    if (this.registerForm.invalid) {
      this.showError(this.translate.instant('SIGNUP.INVALID_FORM'));
      return;
    }

    if (!this.user?.id) {
      this.showError(this.translate.instant('SIGNUP.SPONSOR_REQUIRED'));
      return;
    }

    const user = this.buildUserFromForm();

    const registerRequest = this.googleRegistrationActive
      ? this.authService.registerWithGoogle(this.googleRegistrationToken, user)
      : this.authService.createAffiliate(user);

    registerRequest.subscribe({
      next: response => {
        if (response.success) {
          this.showSuccess(response.message);
          if (this.googleRegistrationActive) {
            this.router
              .navigate(['/app/my-network'], { replaceUrl: true })
              .then();
            return;
          }

          setTimeout(() => {
            this.router.navigate(['/signin']).then();
          }, SIGNIN_REDIRECT_DELAY_MS);
        } else {
          this.showError(buildSignupErrorMessage(response, this.translate));
        }
      },
      error: error => {
        this.showError(buildSignupErrorMessage(error, this.translate));
      },
    });
  }

  getUserByUsername(username: string): void {
    if (!username) return;

    this.authService.getAffiliateByUsername(username).subscribe({
      next: user => {
        if (user?.id) {
          this.sponsor = user.username;
          this.user = user;
        } else {
          this.toastr.error(this.translate.instant('SIGNUP.USER_NOT_FOUND'));
          this.router.navigate(['/signin']).then();
        }
      },
      error: error => {
        console.error('Error fetching user by username:', error);
        this.toastr.error(this.translate.instant('SIGNUP.ERROR_FETCHING_USER'));
        this.router.navigate(['/signin']).then();
      },
    });
  }

  showSuccess(message: string): void {
    this.toastr.success(message);
  }

  showError(message: string): void {
    this.toastr.error(message);
  }

  showTermsAndConditions(): void {
    this.showTermsModal = true;
  }

  closeTermsModal(): void {
    this.showTermsModal = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private fetchCountry(): void {
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

  private buildUserFromForm(): UserAffiliate {
    const user = new UserAffiliate();
    const formValue = this.registerForm.value;

    if (!this.googleRegistrationActive) {
      user.password = formValue.password;
    }
    user.name = formValue.name;
    user.lastName = formValue.last_name;
    user.username = String(formValue.username).trim().toLowerCase();
    user.phone = cleanPhoneNumber(formValue.phone);
    user.countryId = Number(formValue.country);
    user.city = formValue.city;
    user.state = formValue.state;
    user.address = formValue.address;
    user.birtDate = formValue.birtDate;
    user.email = formValue.email;
    user.father = Number(this.user.id);
    user.side = +this.side;
    user.status = true;
    user.termsConditions = formValue.terms_conditions;
    user.roleId = 2;
    user.imageProfileUrl = this.googleProfilePicture;

    return user;
  }

  private async handleGoogleCredential(
    credentialResponse: GoogleCredentialResponse,
  ): Promise<void> {
    this.submitted = false;
    this.error = '';
    this.loading = true;

    try {
      if (!credentialResponse.credential) {
        throw new Error('No se recibió credencial de Google');
      }

      const googleProfile = decodeGoogleProfile(credentialResponse.credential);

      this.googleRegistrationToken = credentialResponse.credential;
      this.googleRegistrationActive = true;
      this.googleProfilePicture = googleProfile.picture ?? '';
      this.applyGoogleRegistrationMode();

      this.registerForm.patchValue({
        email: googleProfile.email ?? '',
        name: googleProfile.given_name ?? googleProfile.name ?? '',
        last_name: googleProfile.family_name ?? '',
      });

      if (this.key && this.user?.id) {
        await this.autoRegisterWithGoogle(googleProfile);
        return;
      }
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

  private async autoRegisterWithGoogle(
    googleProfile: GoogleProfilePayload,
  ): Promise<void> {
    const email = (googleProfile.email ?? '').trim().toLowerCase();
    const name = googleProfile.given_name ?? googleProfile.name ?? 'Usuario';
    const lastName = googleProfile.family_name ?? 'Google';
    const sub = googleProfile.sub ?? Date.now().toString();
    const username = buildGoogleUsername(email, sub);
    const phone = buildGooglePhone(sub);

    const user = new UserAffiliate();
    user.name = name;
    user.lastName = lastName;
    user.email = email;
    user.username = username;
    user.phone = phone;
    user.father = Number(this.user.id);
    user.side = +this.side;
    user.status = true;
    user.termsConditions = true;
    user.roleId = 2;
    user.imageProfileUrl = googleProfile.picture ?? '';
    delete (user as Partial<UserAffiliate>).birtDate;

    try {
      const response = await firstValueFrom(
        this.authService.registerWithGoogle(this.googleRegistrationToken, user),
      );

      if (response?.success) {
        this.showSuccess(response.message);
        await this.router.navigate(['/app/my-network'], { replaceUrl: true });
        return;
      }

      this.showError(buildSignupErrorMessage(response, this.translate));
    } catch (error) {
      this.showError(buildSignupErrorMessage(error, this.translate));
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

  private async initializeGoogleRegisterButton(): Promise<void> {
    const clientId = environment.google?.clientId;
    const container = document.getElementById('google-register-button');

    if (!clientId || !container) {
      return;
    }

    await this.googleIdentity.renderButton({
      container,
      clientId,
      onCredential: response => {
        void this.handleGoogleCredential(response);
      },
      buttonConfig: {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signup_with',
        shape: 'rectangular',
        width: Math.min(
          container.clientWidth || GOOGLE_BUTTON_MAX_WIDTH,
          GOOGLE_BUTTON_MAX_WIDTH,
        ),
        locale: this.translate.getCurrentLang(),
      },
    });
  }
}
