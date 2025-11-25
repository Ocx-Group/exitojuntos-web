import { Component, OnInit } from '@angular/core';

import { AffiliateService } from '@app/core/service/affiliate-service/affiliate.service';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { FirebaseStorageService } from '@app/core/service/firebase-storage-service/firebase-storage.service';

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
  public selectedFile: File | null = null;
  public previewUrl: string | null = null;

  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;

  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService,
    private readonly affiliateService: AffiliateService,
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly firebaseStorage: FirebaseStorageService,
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
      this.selectedFile = null;
      this.previewUrl = null;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.toastr.error(
        this.translate.instant('CLIENT-MY-PROFILE.VALIDATIONS.FIELDS-REQUIRED'),
      );
      return;
    }

    this.isLoading = true;

    // Si hay un archivo seleccionado, primero subirlo a Firebase
    if (this.selectedFile) {
      this.uploadImageAndSaveProfile();
    } else {
      // Si no hay archivo, solo actualizar el perfil
      this.updateProfileData();
    }
  }

  private uploadImageAndSaveProfile() {
    if (!this.selectedFile) {
      return;
    }

    const phone = this.user.phone;

    this.firebaseStorage
      .uploadAffiliateProfileImage(this.selectedFile, phone)
      .subscribe({
        next: (imageUrl: string) => {
          console.log('Imagen subida exitosamente:', imageUrl);
          // Una vez subida la imagen, actualizar el perfil con la URL
          this.updateProfileData(imageUrl);
        },
        error: error => {
          this.isLoading = false;
          console.error('Error al subir imagen:', error);
          this.toastr.error(
            this.translate.instant(
              'CLIENT-MY-PROFILE.MESSAGES.ERROR-UPLOAD-IMAGE',
            ) || 'Error al subir la imagen',
            'Error',
          );
        },
      });
  }

  private updateProfileData(imageUrl?: string) {
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
      imageProfileUrl: imageUrl, // Incluir la URL de la imagen si existe
    };

    this.authService.updateProfile(updateProfileDto).subscribe({
      next: response => {
        this.isLoading = false;
        if (response.success) {
          console.log('Datos actualizados correctamente', response);

          // Actualizar la URL de la imagen en el objeto user local
          if (imageUrl) {
            this.user.imageProfileUrl = imageUrl;
          }

          this.toastr.success(
            response.message ||
              this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.SUCCESS'),
            'Éxito',
          );
          this.isEditMode = false;
          this.selectedFile = null;
          this.previewUrl = null;
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
    if (!this.user.phone) {
      this.toastr.error(
        this.translate.instant('CLIENT-MY-PROFILE.HEADER.REFERRAL-LINK-ERROR'),
      );
      return;
    }

    const referralUrl = `exitojuntos.com/signup/${this.user.phone}`;
    this.clipboardService.copyFromContent(referralUrl);
    this.toastr.success(
      this.translate.instant('CLIENT-MY-PROFILE.HEADER.REFERRAL-LINK-COPIED'),
    );
  }
}
