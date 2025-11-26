import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';

import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { ToastrService } from 'ngx-toastr';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@app/layout/header/header.component';
import { SidebarComponent } from '@app/layout/sidebar/sidebar.component';
import { FooterComponent } from '@app/layout/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: [],
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MainLayoutComponent implements OnInit {
  user: UserAffiliate = new UserAffiliate();
  constructor(
    // private documentCheckService: DocumentCheckService,
    private readonly authService: AuthService,
    private readonly toast: ToastrService,
  ) {}

  ngOnInit() {
    this.user = this.authService.currentUserAffiliateValue;
  }

  showSuccess(message: string) {
    this.toast.success(message);
  }

  showError(message: string) {
    this.toast.error(message);
  }
}
