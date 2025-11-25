import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
})
export class EmailVerificationComponent implements OnInit {
  verificationStatus: 'loading' | 'success' | 'error' | 'already-verified' =
    'loading';
  verificationCode: string = '';
  errorMessage: string = '';
  userData: any = null;
  readonly navbarIcon = 'assets/exito-logo.svg';

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.verificationCode =
      this.activatedRoute.snapshot.queryParams['code'] || '';

    if (!this.verificationCode) {
      this.verificationStatus = 'error';
      this.errorMessage = this.translate.instant(
        'EMAIL_VERIFICATION.INVALID_CODE',
      );
      return;
    }

    this.verifyEmail();
  }

  verifyEmail(): void {
    this.authService
      .verifyEmail(this.verificationCode)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.verificationStatus = 'success';
            this.userData = response.data?.user || response.user;
          } else {
            this.handleError(response);
          }
        },
        error: error => {
          this.handleError(error);
        },
      });
  }

  private handleError(error: any): void {
    const statusCode = error?.status || error?.code;

    if (statusCode === 409) {
      this.verificationStatus = 'already-verified';
      this.errorMessage = this.translate.instant(
        'EMAIL_VERIFICATION.ALREADY_VERIFIED',
      );
    } else if (statusCode === 404) {
      this.verificationStatus = 'error';
      this.errorMessage = this.translate.instant(
        'EMAIL_VERIFICATION.INVALID_OR_EXPIRED',
      );
    } else {
      this.verificationStatus = 'error';
      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        this.translate.instant('EMAIL_VERIFICATION.GENERIC_ERROR');
    }
  }

  goToLogin(): void {
    this.router.navigate(['/signin']);
  }
}
