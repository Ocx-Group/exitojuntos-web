import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Country } from '@app/core/models/country-model/country.model';
import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';
import { AffiliateService } from '@app/core/service/affiliate-service/affiliate.service';
import { CountryService } from '@app/core/service/country-service/country.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TermsConditionsComponent } from '@app/shared/components/terms-conditions/terms-conditions.component';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    TermsConditionsComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupComponent implements OnInit {
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
  private readonly countryService: CountryService = inject(CountryService);

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly affiliateService: AffiliateService,
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
        console.log('Countries loaded:', data);
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
  }

  onCountrySelected(countryIso: string) {
    const countryId = Number.parseInt(countryIso, 10);
    if (Number.isNaN(countryId)) {
      return;
    }
    const country = this.listcountry.find(c => c.id === countryId);
    if (!country) {
      return;
    }
    if (country.phoneCode === '1') {
      return;
    }
    // Remove + symbol from phone code
    const phoneCode = country.phoneCode.split('+').join('');
    this.registerForm.patchValue({
      phone: phoneCode,
    });
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

    this.affiliateService.getAffiliateByPhone(phone).subscribe({
      next: (user: UserAffiliate) => {
        console.log('getUserByPhone received user:', user);
        if (user?.id) {
          this.sponsor = user.phone;
          this.user = user;
          console.log('User loaded successfully:', this.user);
        } else {
          console.error('User not found or invalid data for phone:', phone);
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

    const user = new UserAffiliate();
    const cleanPhone = this.cleanPhoneNumber(this.registerForm.value.phone);
    user.password = this.registerForm.value.password;
    user.name = this.registerForm.value.name;
    user.lastName = this.registerForm.value.last_name;
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

    this.affiliateService.createAffiliate(user).subscribe({
      next: response => {
        if (response.success) {
          this.showSuccess(response.message);
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

  showSuccess(message: string) {
    this.toastr.success(message);
  }

  showError(message: string) {
    this.toastr.error(message);
  }

  private getErrorMessage(error: any): string {
    const statusCode = error?.code || error?.status;

    // Intentar extraer el mensaje de diferentes ubicaciones posibles
    let message = '';
    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message && !error.message.includes('Http failure')) {
      message = error.message;
    } else if (error?.error) {
      // Si error.error es un string
      if (typeof error.error === 'string') {
        message = error.error;
      }
    }

    // Si el código es 409, es un error de conflicto (duplicado)
    // Detectar por palabras clave en el mensaje del backend
    if (statusCode === 409) {
      const normalizedMessage = this.normalizeText(message);

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
}

// Validador para comparar contraseñas a nivel de formulario
export function passwordMatchValidator(formGroup: FormGroup) {
  const password = formGroup.get('password').value;
  const confirmPassword = formGroup.get('repitpassword').value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

// Validador para evitar espacios en blanco en el User name
export function NoWhitespaceValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (control.value.includes(' ')) {
    return { whitespace: true };
  } else {
    return null;
  }
}
