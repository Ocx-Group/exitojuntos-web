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
import { StorageService } from '@app/core/service/storage-service/storage.service';
import { ImageProfileService } from '@app/core/service/image-profile-service/image-profile.service';

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
  private readonly storageService = inject(StorageService);
  private readonly imageProfileService = inject(ImageProfileService);

  protected user: UserAffiliate = new UserAffiliate();
  protected profileForm: FormGroup;
  protected readonly isEditMode = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isUploadingPhoto = signal(false);

  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private static readonly MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Permite volver a seleccionar el mismo archivo más tarde.
    input.value = '';

    if (!file) {
      return;
    }

    if (!DashboardComponent.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.toastr.error(
        this.translate.instant('CLIENT-DASHBOARD.MESSAGES.INVALID-IMAGE'),
      );
      return;
    }

    if (file.size > DashboardComponent.MAX_IMAGE_SIZE_BYTES) {
      this.toastr.error(
        this.translate.instant('CLIENT-DASHBOARD.MESSAGES.IMAGE-TOO-LARGE'),
      );
      return;
    }

    this.isUploadingPhoto.set(true);

    this.storageService.uploadProfilePhoto(file).subscribe({
      next: url => this.persistPhotoUrl(url),
      error: error => {
        this.isUploadingPhoto.set(false);
        const errorMessage =
          error?.error?.message ||
          this.translate.instant('CLIENT-DASHBOARD.MESSAGES.PHOTO-ERROR');
        this.toastr.error(errorMessage);
      },
    });
  }

  private persistPhotoUrl(url: string): void {
    this.authService.updateProfile({ imageProfileUrl: url }).subscribe({
      next: response => {
        this.isUploadingPhoto.set(false);
        if (response.success) {
          const refreshedUser = this.authService.currentUserAffiliateValue;
          if (refreshedUser) {
            this.user = { ...refreshedUser };
          }
          // Refresca el avatar mostrado en el navbar.
          this.imageProfileService.setImageURL(url);
          this.toastr.success(
            this.translate.instant('CLIENT-DASHBOARD.MESSAGES.PHOTO-SUCCESS'),
            this.translate.instant('CLIENT-DASHBOARD.MESSAGES.SUCCESS-TITLE'),
          );
        } else {
          this.toastr.error(
            response.message ||
              this.translate.instant('CLIENT-DASHBOARD.MESSAGES.PHOTO-ERROR'),
          );
        }
      },
      error: error => {
        this.isUploadingPhoto.set(false);
        const errorMessage =
          error?.error?.message ||
          this.translate.instant('CLIENT-DASHBOARD.MESSAGES.PHOTO-ERROR');
        this.toastr.error(errorMessage);
      },
    });
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
