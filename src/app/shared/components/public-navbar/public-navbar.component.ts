import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { CartService } from '@app/core/service/cart-service';

interface NavLanguage {
  code: string;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './public-navbar.component.html',
  styleUrls: ['./public-navbar.component.scss'],
})
export class PublicNavbarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly navbarIcon = 'assets/exito-logo.svg';
  protected readonly userMenuOpen = signal(false);
  protected readonly langOpen = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly currentLang = signal('en');
  protected isScrolled = false;

  protected readonly languages: NavLanguage[] = [
    { code: 'es', label: 'Español', flag: 'assets/images/flags/spain.jpg' },
    { code: 'en', label: 'English', flag: 'assets/images/flags/us.jpg' },
    { code: 'fr', label: 'Français', flag: 'assets/images/flags/france.png' },
    { code: 'pt', label: 'Português', flag: 'assets/images/flags/brazil.png' },
  ];

  protected readonly currentFlag = computed(() => {
    const code = this.currentLang();
    return (
      this.languages.find(l => l.code === code)?.flag ?? this.languages[1].flag
    );
  });

  protected readonly userAvatar = computed(
    () =>
      this.authService.userAffiliate()?.imageProfileUrl ||
      'assets/images/user.png',
  );

  protected readonly userName = computed(() => {
    const u = this.authService.userAffiliate();
    if (!u) return '';
    return u.name || u.username || u.email || 'Usuario';
  });

  protected readonly isAdmin = computed(
    () =>
      this.authService.userAffiliate()?.role?.name?.toLowerCase() === 'admin',
  );

  ngOnInit(): void {
    const stored = localStorage.getItem('lang');
    const lang = this.normalizeLang(stored ?? this.translate.getCurrentLang());
    this.currentLang.set(lang);
    this.translate.use(lang);

    if (this.authService.isLoggedIn() && !this.isAdmin()) {
      this.cartService
        .loadCart()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ error: () => {} });
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.userMenuOpen() && !target.closest('.lp-navbar__user-menu')) {
      this.userMenuOpen.set(false);
    }
    if (this.langOpen() && !target.closest('.lp-lang')) {
      this.langOpen.set(false);
    }
  }

  protected toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
    if (this.userMenuOpen()) this.langOpen.set(false);
  }

  protected toggleLang(event: Event): void {
    event.stopPropagation();
    this.langOpen.update(v => !v);
    if (this.langOpen()) this.userMenuOpen.set(false);
  }

  protected toggleMobile(): void {
    this.mobileOpen.update(v => !v);
    this.langOpen.set(false);
    this.userMenuOpen.set(false);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
  }

  protected changeLanguage(code: string): void {
    this.currentLang.set(code);
    this.translate.use(code);
    localStorage.setItem('lang', code);
    this.langOpen.set(false);
  }

  protected logout(): void {
    this.authService.logoutUser();
    this.cartService.reset();
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);
    this.toastr.success('Sesión cerrada');
    this.router.navigate(['/welcome']);
  }

  protected openSignin(): void {
    this.router.navigate(['/signin']);
    this.mobileOpen.set(false);
  }

  protected goToCheckout(): void {
    this.router.navigate(['/checkout']);
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);
  }

  protected goToDashboard(): void {
    const route = this.isAdmin()
      ? '/admin/users-management'
      : '/app/dashboard';
    this.router.navigate([route]);
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);
  }

  private normalizeLang(value?: string | null): string {
    if (!value) return 'en';
    const code = value.toLowerCase().split('-')[0];
    return this.languages.some(l => l.code === code) ? code : 'en';
  }
}
