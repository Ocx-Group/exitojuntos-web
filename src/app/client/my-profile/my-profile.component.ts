import { Component, OnInit } from '@angular/core';

import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { StorageService } from '@app/core/service/storage-service/storage.service';
import { ImageProfileService } from '@app/core/service/image-profile-service/image-profile.service';

import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';

import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';

const header = ['Movimientos', 'IP', 'Fecha'];
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class MyProfileComponent implements OnInit {
  public user: UserAffiliate = new UserAffiliate();
  public profileForm: FormGroup;
  public isEditMode = false;
  public isLoading = false;
  public isUploadingPhoto = false;

  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private static readonly MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;

  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
    private readonly imageProfileService: ImageProfileService,
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: [''],
      address: [''],
      city: [''],
    });
  }

  ngOnInit(): void {
    // Usar el signal para obtener el usuario actual
    const currentUser = this.authService.currentUserAffiliateValue;
    console.log(currentUser);
    if (currentUser) {
      this.user = { ...currentUser };
      this.populateForm();
    }
  }

  populateForm() {
    this.profileForm.patchValue({
      name: this.user.name || '',
      lastName: this.user.lastName || '',
      birthDate: this.user.birtDate || '',
      address: this.user.address || '',
      city: this.user.city || '',
    });
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.populateForm();
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!MyProfileComponent.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.toastr.error(
        this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.INVALID-IMAGE'),
      );
      input.value = '';
      return;
    }

    if (file.size > MyProfileComponent.MAX_IMAGE_SIZE_BYTES) {
      this.toastr.error(
        this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.IMAGE-TOO-LARGE'),
      );
      input.value = '';
      return;
    }

    this.uploadPhoto(file);
    // Permite volver a seleccionar el mismo archivo si fuese necesario.
    input.value = '';
  }

  private uploadPhoto(file: File): void {
    this.isUploadingPhoto = true;

    this.storageService.uploadProfilePhoto(file).subscribe({
      next: url => this.persistPhotoUrl(url),
      error: error => {
        this.isUploadingPhoto = false;
        const errorMessage =
          error.error?.message ||
          this.translate.instant(
            'CLIENT-MY-PROFILE.MESSAGES.ERROR-UPLOAD-IMAGE',
          );
        this.toastr.error(errorMessage, 'Error');
        console.error('Error al subir la foto de perfil:', error);
      },
    });
  }

  private persistPhotoUrl(url: string): void {
    this.authService.updateProfile({ imageProfileUrl: url }).subscribe({
      next: response => {
        this.isUploadingPhoto = false;
        if (response.success) {
          this.user.imageProfileUrl = url;
          // Refresca el avatar mostrado en el navbar/sidebar.
          this.imageProfileService.setImageURL(url);
          this.toastr.success(
            this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.PHOTO-SUCCESS'),
            'Éxito',
          );
        } else {
          this.toastr.error(
            response.message ||
              this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.ERROR'),
            'Error',
          );
        }
      },
      error: error => {
        this.isUploadingPhoto = false;
        const errorMessage =
          error.error?.message ||
          this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.ERROR');
        this.toastr.error(errorMessage, 'Error');
        console.error('Error al guardar la foto de perfil:', error);
      },
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.toastr.error(
        this.translate.instant('CLIENT-MY-PROFILE.VALIDATIONS.FIELDS-REQUIRED'),
      );
      return;
    }

    this.isLoading = true;
    this.updateProfileData();
  }

  private updateProfileData() {
    const formData = this.profileForm.value;

    // Actualizar el objeto user con los datos del formulario
    this.user.name = formData.name;
    this.user.lastName = formData.lastName;
    this.user.birtDate = formData.birthDate;
    this.user.address = formData.address;
    this.user.city = formData.city;

    // Crear el DTO con los tipos correctos
    const updateProfileDto = {
      name: formData.name,
      lastName: formData.lastName,
      birtDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
      address: formData.address,
      city: formData.city,
    };

    this.authService.updateProfile(updateProfileDto).subscribe({
      next: response => {
        this.isLoading = false;
        if (response.success) {
          console.log('Datos actualizados correctamente', response);

          this.toastr.success(
            response.message ||
              this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.SUCCESS'),
            'Éxito',
          );
          this.isEditMode = false;
        } else {
          this.toastr.error(
            response.message ||
              this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.ERROR'),
            'Error',
          );
        }
      },
      error: error => {
        this.isLoading = false;
        const errorMessage =
          error.error?.message ||
          error.message ||
          this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.ERROR');
        this.toastr.error(errorMessage, 'Error');
        console.error('Error al actualizar perfil:', error);
      },
    });
  }

  clipBoardCopy() {
    const string = JSON.stringify(this.temp);
    this.clipboardService.copyFromContent(string);

    if (this.temp.length === 0) {
      this.toastr.info('No data to copy');
    } else {
      this.toastr.success('Copied ' + this.temp.length + ' rows successfully');
    }
  }

  shareReferralLink() {
    if (!this.user.username) {
      this.toastr.error(
        this.translate.instant('CLIENT-MY-PROFILE.HEADER.REFERRAL-LINK-ERROR'),
      );
      return;
    }

    window.open(`/signup/${this.user.username}`);
    const referralUrl = `exitojuntos.com/signup/${this.user.username}`;
    this.clipboardService.copyFromContent(referralUrl);
    this.toastr.success(
      this.translate.instant('CLIENT-MY-PROFILE.HEADER.REFERRAL-LINK-COPIED'),
    );
  }
}
