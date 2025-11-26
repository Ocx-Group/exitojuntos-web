import { ImageProfileService } from '@app/core/service/image-profile-service/image-profile.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Storage } from '@angular/fire/storage';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';

import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { NgxDropzoneModule } from 'ngx-dropzone';

@Component({
  selector: 'app-img-profile',
  templateUrl: './img-profile.component.html',
  styleUrls: ['./img-profile.component.sass'],
  standalone: true,
  imports: [CommonModule, NgxDropzoneModule],
})
export class ImgProfileComponent implements OnInit {
  @ViewChild('profileImgModal', { static: true })
  private readonly modalContent: TemplateRef<any>;
  file: File | null = null;
  fileRef: any;
  user: UserAffiliate = new UserAffiliate();

  constructor(
    private readonly modalService: NgbModal,
    private readonly storage: Storage,
    private readonly authService: AuthService,
    private readonly toastr: ToastrService,
    private readonly imageProfileService: ImageProfileService,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserAffiliateValue;
    console.log(this.user);
  }

  showSuccess(message: string) {
    this.toastr.success(message);
  }

  showError(message: string) {
    this.toastr.error(message);
  }

  openProfileImgModal() {
    this.modalService.open(this.modalContent, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      centered: true,
    });
  }
}
