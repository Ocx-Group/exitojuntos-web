import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';

import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';
import { AuthService } from '@app/core/service/authentication-service/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly clipboardService = inject(ClipboardService);

  protected user: UserAffiliate = new UserAffiliate();
  protected profileForm: FormGroup;
  protected readonly isEditMode = signal(false);
  protected readonly isLoading = signal(false);

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/),
        ],
      ],
      birthDate: [''],
      address: [''],
      city: [''],
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserAffiliateValue;
    if (currentUser) {
      this.user = { ...currentUser };
      this.populateForm();
    }
  }

  protected populateForm(): void {
    this.profileForm.patchValue({
      name: this.user.name || '',
      lastName: this.user.lastName || '',
      username: this.user.username || '',
      birthDate: this.user.birtDate
        ? this.formatDateForInput(this.user.birtDate)
        : '',
      address: this.user.address || '',
      city: this.user.city || '',
    });
  }

  protected toggleEditMode(): void {
    this.isEditMode.update(v => !v);
    if (!this.isEditMode()) {
      this.populateForm();
    }
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastr.error(
        this.translate.instant('CLIENT-DASHBOARD.VALIDATIONS.FIELDS-REQUIRED'),
      );
      return;
    }

    this.isLoading.set(true);

    const formValue = this.profileForm.value;
    const trimmedUsername = (formValue.username || '').trim().toLowerCase();

    const payload = {
      name: formValue.name,
      lastName: formValue.lastName,
      username: trimmedUsername,
      birtDate: formValue.birthDate
        ? new Date(formValue.birthDate)
        : undefined,
      address: formValue.address,
      city: formValue.city,
    };

    this.authService.updateProfile(payload).subscribe({
      next: response => {
        this.isLoading.set(false);
        if (response.success) {
          const refreshedUser = this.authService.currentUserAffiliateValue;
          if (refreshedUser) {
            this.user = { ...refreshedUser };
          }
          this.populateForm();
          this.isEditMode.set(false);
          this.toastr.success(
            response.message ||
              this.translate.instant('CLIENT-DASHBOARD.MESSAGES.SUCCESS'),
            this.translate.instant('CLIENT-DASHBOARD.MESSAGES.SUCCESS-TITLE'),
          );
        } else {
          this.toastr.error(
            response.message ||
              this.translate.instant('CLIENT-DASHBOARD.MESSAGES.ERROR'),
          );
        }
      },
      error: error => {
        this.isLoading.set(false);
        const errorMessage =
          error?.error?.message ||
          error?.message ||
          this.translate.instant('CLIENT-DASHBOARD.MESSAGES.ERROR');
        this.toastr.error(errorMessage);
      },
    });
  }

  protected shareReferralLink(): void {
    if (!this.user.username) {
      this.toastr.error(
        this.translate.instant('CLIENT-DASHBOARD.REFERRAL.LINK-ERROR'),
      );
      return;
    }

    const referralUrl = `exitojuntos.com/signup/${this.user.username}`;
    this.clipboardService.copyFromContent(referralUrl);
    this.toastr.success(
      this.translate.instant('CLIENT-DASHBOARD.REFERRAL.LINK-COPIED'),
    );
  }

  protected get referralLink(): string {
    return this.user.username
      ? `exitojuntos.com/signup/${this.user.username}`
      : '';
  }

  protected get usernameControl() {
    return this.profileForm.get('username');
  }

  protected get nameControl() {
    return this.profileForm.get('name');
  }

  protected get lastNameControl() {
    return this.profileForm.get('lastName');
  }

  private formatDateForInput(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
