import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
})
export class ForgotComponent implements OnInit {
  forgotPassword: FormGroup;
  submitted = false;
  loading = false;
  readonly navbarIcon = 'assets/exito-logo.svg';

  constructor(
    private readonly authService: AuthService,
    private readonly toastr: ToastrService,
    private readonly translate: TranslateService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.initForgotPassword();
  }

  get create_forgot_controls(): { [key: string]: AbstractControl } {
    return this.forgotPassword.controls;
  }

  initForgotPassword() {
    this.forgotPassword = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  sendPasswordRecovery() {
    this.submitted = true;

    if (this.forgotPassword.invalid) return;

    const email = this.forgotPassword.value.email;
    this.loading = true;

    this.authService.requestPasswordReset(email).subscribe({
      next: response => {
        this.loading = false;
        if (response.success) {
          this.emailConfirmation();
        } else {
          const errorMessage = this.translate.instant('FORGOT.USER_NOT_FOUND');
          this.toastr.error(errorMessage);
        }
      },
      error: () => {
        this.loading = false;
        const errorMessage = this.translate.instant('FORGOT.ERROR');
        this.toastr.error(errorMessage);
      },
    });
  }

  validateEmail() {
    const emailControl = this.forgotPassword.get('email');
    if (emailControl?.errors) {
      return;
    }

    if (emailControl?.dirty) {
      emailControl.updateValueAndValidity();
    }
  }

  emailConfirmation() {
    const title = this.translate.instant('FORGOT.SUCCESS_TITLE');
    const text = this.translate.instant('FORGOT.SUCCESS_MESSAGE');
    const confirmButtonText = this.translate.instant('FORGOT.SUCCESS_BUTTON');

    Swal.fire({
      title: title,
      text: text,
      icon: 'success',
      confirmButtonText: confirmButtonText,
      confirmButtonColor: '#FFB800',
      background: '#1a1a1a',
      color: '#ffffff',
    }).then(() => {
      // Navegar al componente reset después de cerrar el modal
      this.router.navigate(['/reset']);
    });
  }
}
