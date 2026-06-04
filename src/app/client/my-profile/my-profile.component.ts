import { Component, OnInit } from '@angular/core';

import { AuthService } from '@app/core/service/authentication-service/auth.service';

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

  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;

  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService,
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
