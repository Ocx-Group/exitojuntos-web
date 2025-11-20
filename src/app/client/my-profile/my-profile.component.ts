import { Component, OnInit } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { LoginMovements } from '@app/core/models/signin-model/login-movements.model';

import { AffiliateService } from '@app/core/service/affiliate-service/affiliate.service';
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
    NgbDropdownItem,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
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

  getUserInfo() {
    const currentUser = this.authService.currentUserAffiliateValue;
    if (!currentUser) return;

    this.affiliateService
      .getAffiliateById(currentUser.id)
      .subscribe(response => {
        if (response.success) {
          this.user = response.data;
          this.populateForm();
        }
      });
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
    const formData = this.profileForm.value;

    // Actualizar el objeto user con los datos del formulario
    this.user.name = formData.name;
    this.user.lastName = formData.lastName;
    this.user.birtDate = formData.birthDate;
    this.user.address = formData.address;
    this.user.city = formData.city;

    this.affiliateService.updateAffiliate(this.user).subscribe({
      next: response => {
        if (response.success) {
          this.toastr.success(
            this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.SUCCESS'),
          );
          this.isEditMode = false;
          this.getUserInfo();
        } else {
          this.toastr.error(
            this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.ERROR'),
          );
        }
        this.isLoading = false;
      },
      error: error => {
        this.toastr.error(
          this.translate.instant('CLIENT-MY-PROFILE.MESSAGES.ERROR'),
        );
        this.isLoading = false;
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
}
