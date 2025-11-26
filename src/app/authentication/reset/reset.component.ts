import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { AffiliateService } from '@app/core/service/affiliate-service/affiliate.service';
import { RequestResetPassword } from '@app/core/models/user-affiliate-model/request-reset-password-model';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
})
export class ResetComponent implements OnInit {
  resetPassword: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  readonly navbarIcon = 'assets/exito-logo.svg';

  constructor(
    private readonly affiliateService: AffiliateService,
    private readonly toastr: ToastrService,
    private readonly translate: TranslateService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.initResetPassword();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.resetPassword.controls;
  }

  initResetPassword() {
    this.resetPassword = new FormGroup(
      {
        securityCode: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
        ]),
        newPassword: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(16),
        ]),
        confirmPassword: new FormControl('', [Validators.required]),
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(
    control: AbstractControl,
  ): { [key: string]: boolean } | null {
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitResetPassword() {
    this.submitted = true;

    if (this.resetPassword.invalid) {
      return;
    }

    const { securityCode, newPassword } = this.resetPassword.value;
    this.loading = true;

    const requestResetPassword = new RequestResetPassword();
    requestResetPassword.verificationCode = securityCode;
    requestResetPassword.password = newPassword;

    this.affiliateService.resetPassword(requestResetPassword).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          const successMessage = this.translate.instant('RESET.SUCCESS');
          this.toastr.success(successMessage);
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/signin']);
          }, 2000);
        } else {
          const errorMessage =
            response.message || this.translate.instant('RESET.INVALID_CODE');
          this.toastr.error(errorMessage);
        }
      },
      error: error => {
        this.loading = false;
        const errorMessage =
          error.error?.message || this.translate.instant('RESET.ERROR');
        this.toastr.error(errorMessage);
      },
    });
  }
}
