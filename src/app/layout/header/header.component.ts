import { RightSidebarService } from 'src/app/core/service/rightsidebar-service/rightsidebar.service';
import { AuthService } from 'src/app/core/service/authentication-service/auth.service';
import { DOCUMENT, CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  ElementRef,
  OnInit,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from 'src/app/core/service/language-service/language.service';
import { map, Observable, Subscription } from 'rxjs';

import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';
import { IconsModule } from '@app/shared';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfigService } from '@app/core/service/config/config.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, IconsModule, TranslateModule, NgbModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  public user: UserAffiliate = new UserAffiliate();
  private readonly subscriptions: Subscription[] = [];
  public config: any = {};
  isNavbarCollapsed = true;
  flagvalue;
  countryName;
  langStoreValue: string;
  defaultFlag: string;
  isOpenSidebar: boolean;
  totalItem: number = 0;
  public unreadCount$: Observable<number>;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly renderer: Renderer2,
    public elementRef: ElementRef,
    private readonly rightSidebarService: RightSidebarService,
    private readonly authService: AuthService,
    private readonly router: Router,
    public readonly languageService: LanguageService,
    private readonly configService: ConfigService,
  ) {}

  listLang = [
    { text: 'English', flag: 'assets/images/flags/us.jpg', lang: 'en' },
    { text: 'Spanish', flag: 'assets/images/flags/spain.jpg', lang: 'es' },
    { text: 'French', flag: 'assets/images/flags/france.png', lang: 'fr' },
    { text: 'Portuguese', flag: 'assets/images/flags/brazil.png', lang: 'pt' },
  ];

  ngOnInit() {
    this.config = this.configService.configData;
    this.user = this.authService.currentUserAffiliateValue;

    this.langStoreValue = localStorage.getItem('lang');
    const val = this.listLang.filter(x => x.lang === this.langStoreValue);
    this.countryName = val.map(element => element.text);
    if (val.length === 0) {
      if (this.flagvalue === undefined) {
        this.defaultFlag = 'assets/images/flags/us.jpg';
      }
    } else {
      this.flagvalue = val.map(element => element.flag);
    }
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    // set theme on startup
    if (localStorage.getItem('theme')) {
      this.renderer.removeClass(this.document.body, this.config.layout.variant);
      this.renderer.addClass(this.document.body, localStorage.getItem('theme'));
    } else {
      this.renderer.addClass(this.document.body, this.config.layout.variant);
    }

    if (localStorage.getItem('menuOption')) {
      this.renderer.addClass(
        this.document.body,
        localStorage.getItem('menuOption'),
      );
    } else {
      this.renderer.addClass(
        this.document.body,
        this.config.layout.sidebar.backgroundColor + '-sidebar',
      );
    }

    if (localStorage.getItem('sidebar_status')) {
      if (localStorage.getItem('sidebar_status') === 'close') {
        this.renderer.addClass(this.document.body, 'side-closed');
        this.renderer.addClass(this.document.body, 'submenu-closed');
      } else {
        this.renderer.removeClass(this.document.body, 'side-closed');
        this.renderer.removeClass(this.document.body, 'submenu-closed');
      }
    } else if (this.config.layout.sidebar.collapsed === true) {
      this.renderer.addClass(this.document.body, 'side-closed');
      this.renderer.addClass(this.document.body, 'submenu-closed');
    }
  }

  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.langStoreValue = lang;
    this.languageService.setLanguage(lang);
  }

  mobileMenuSidebarOpen(event: any, className: string) {
    if (window.innerWidth < 1025) {
      const hasClass = event.target.classList.contains(className);
      if (hasClass) {
        this.renderer.removeClass(this.document.body, className);
        this.renderer.addClass(this.document.body, 'sidebar-gone');
      } else {
        this.renderer.addClass(this.document.body, className);
        this.renderer.removeClass(this.document.body, 'sidebar-gone');
      }
    } else {
      const hasClass = this.document.body.classList.contains('side-closed');
      if (hasClass) {
        this.renderer.removeClass(this.document.body, 'side-closed');
        this.renderer.removeClass(this.document.body, 'submenu-closed');
      } else {
        this.renderer.addClass(this.document.body, 'side-closed');
        this.renderer.addClass(this.document.body, 'submenu-closed');
      }
    }
  }

  public toggleRightSidebar(): void {
    this.rightSidebarService.sidebarState.subscribe(isRunning => {
      this.isOpenSidebar = isRunning;
    });

    this.isOpenSidebar = !this.isOpenSidebar;
    this.rightSidebarService.setRightSidebar(this.isOpenSidebar);
  }

  logout() {
    this.authService.logoutUser().subscribe(res => {
      if (!res.success) {
        this.router.navigate(['/signin']).then();
      }
    });
  }
}
