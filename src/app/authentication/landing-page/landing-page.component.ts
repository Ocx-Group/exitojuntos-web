import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';
import { AffiliateService } from '@app/core/service/affiliate-service/affiliate.service';
import { AuthService } from '@app/core/service/authentication-service/auth.service';
import { PdfViewerService } from '@app/core/service/pdf-viewer-service/pdf-viewer.service';

@Component({
  selector: 'app-home',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ToastrService],
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingPageComponent implements OnInit, OnDestroy {
  isNavbarVisible = false;
  documents = {
    whitePaper: {
      url: 'assets/pdf/WhitePaper-2025.pdf',
      title: 'White Paper - exitojuntos',
    },
    legalDoc: {
      url: 'assets/pdf/LEGAL-DOCUMENTATION.pdf',
      title: 'Documentos Legales - exitojuntos',
    },
    exitojuntosProject: {
      url: 'assets/pdf/PROJECT.pdf',
      title: 'Proyecto exitojuntos',
    },
  };
  showVideoModal: boolean = false;
  currentVideoUrl: string = '';
  currentLang: string = 'en';
  isLanguageDropdownOpen: boolean = false;
  key: string = '';
  videos = {
    es: {
      url: '5VY0Hu8EW-c',
      title: 'Ver Video Informativo',
    },
    en: {
      url: '5VY0Hu8EW-c',
      title: 'Watch Information Video',
    },
  };
  isPreviewHovered: boolean = false;
  user: UserAffiliate | null = null;
  readonly heroBadgeIcon = 'fa-trophy';
  readonly primaryCtaArrow = 'fa-arrow-right';
  readonly heroMetrics = [
    { value: '98%', label: 'Rentabilidad' },
    { value: '$500M+', label: 'Gestionados' },
    { value: '10K+', label: 'Inversores' },
  ];
  readonly featureCards = [
    {
      icon: 'fa-chart-line',
      title: 'Trading Avanzado',
      description:
        'Algoritmos de última generación para maximizar tus inversiones en tiempo real.',
    },
    {
      icon: 'fa-shield-alt',
      title: 'Seguridad Total',
      description:
        'Tus activos protegidos con la más alta tecnología de seguridad bancaria.',
    },
    {
      icon: 'fa-chart-pie',
      title: 'Análisis Profundo',
      description:
        'Informes detallados y análisis de mercado para decisiones informadas.',
    },
    {
      icon: 'fa-user-tie',
      title: 'Asesoría Personalizada',
      description:
        'Expertos dedicados a ayudarte a alcanzar tus objetivos financieros.',
    },
    {
      icon: 'fa-eye',
      title: 'Transparencia',
      description:
        'Total claridad en cada operación y movimiento de tu portafolio.',
    },
    {
      icon: 'fa-headset',
      title: '24/7 Soporte',
      description:
        'Atención continua para que nunca te pierdas una oportunidad.',
    },
  ];
  readonly tradingImage = 'assets/images/TradingSection.png';
  readonly tradingHighlights = [
    'Rendimientos superiores al mercado',
    'Diversificación inteligente de portafolio',
    'Gestión de riesgos avanzada',
    'Acceso a mercados exclusivos',
  ];
  readonly checkIcon = 'fa-check';
  readonly processSteps = [
    {
      number: '01',
      icon: 'fa-user-plus',
      title: 'Registro',
      description:
        'Crea tu cuenta en minutos y verifica tu identidad de forma segura.',
    },
    {
      number: '02',
      icon: 'fa-clipboard-list',
      title: 'Planificación',
      description:
        'Nuestros expertos diseñan una estrategia personalizada para ti.',
    },
    {
      number: '03',
      icon: 'fa-coins',
      title: 'Inversión',
      description:
        'Comienza a invertir con el respaldo de tecnología de punta.',
    },
    {
      number: '04',
      icon: 'fa-chart-area',
      title: 'Crecimiento',
      description: 'Observa cómo tu patrimonio crece consistentemente.',
    },
  ];
  readonly testimonials = [
    {
      quote:
        '"La mejor decisión financiera que he tomado. En 6 meses, mi portafolio creció un 85%. El equipo es excepcional."',
      avatar: 'assets/images/user.png',
      name: 'Carlos Mendoza',
      role: 'CEO, TechVentures',
      rating: 5,
    },
    {
      quote:
        '"Profesionalismo y resultados reales. La asesoría personalizada marca la diferencia. Altamente recomendado."',
      avatar: 'assets/images/user.png',
      name: 'María González',
      role: 'Emprendedora',
      rating: 5,
    },
    {
      quote:
        '"Transparencia total y rendimientos consistentes. Finalmente encontré una plataforma en la que puedo confiar."',
      avatar: 'assets/images/user.png',
      name: 'Roberto Silva',
      role: 'Inversor',
      rating: 5,
    },
  ];
  readonly testimonialQuoteIcon = 'fa-quote-left';
  readonly starIcon = 'fa-star';
  readonly brandIcon = 'assets/exito-logo.svg';
  readonly navbarIcon = 'assets/exito-logo.svg';
  readonly contactIcons = {
    mail: 'fa-envelope',
    phone: 'fa-phone',
    location: 'fa-map-marker-alt',
  };
  readonly ctaStats = [
    { value: 'A+', label: 'Calificación' },
    { value: '100%', label: 'Seguro' },
    { value: '24/7', label: 'Soporte' },
  ];
  readonly footerLinks = [
    {
      heading: 'Enlaces',
      items: [
        { label: 'Servicios', href: '#servicios' },
        { label: 'Nosotros', href: '#nosotros' },
        { label: 'Testimonios', href: '#testimonios' },
        { label: 'Contacto', href: '#contacto' },
      ],
    },
    {
      heading: 'Legal',
      items: [
        { label: 'Privacidad', href: '#privacidad' },
        { label: 'Términos', href: '#terminos' },
        { label: 'Regulación', href: '#regulacion' },
        { label: 'Seguridad', href: '#seguridad' },
      ],
    },
  ];

  readonly languageFlags: { [key: string]: string } = {
    es: 'assets/images/flags/spain.jpg',
    en: 'assets/images/flags/us.jpg',
    fr: 'assets/images/flags/france.png',
    pt: 'assets/images/flags/brazil.png',
  };

  constructor(
    private readonly pdfViewerService: PdfViewerService,
    private readonly translate: TranslateService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly affiliateService: AffiliateService,
    private readonly authService: AuthService,
  ) {
    translate.setFallbackLang('en');
    this.currentLang = translate.getCurrentLang() || 'en';
    this.key = this.activatedRoute.snapshot.params.key;

    // Si hay un usuario logueado, usar sus datos
    const loggedUser = this.authService.userAffiliate();
    if (loggedUser) {
      this.user = loggedUser;
    } else if (this.key) {
      // Si no hay usuario logueado pero hay key en la ruta, buscar por username
      this.getUserByUsername(this.key);
    }
  }

  ngOnInit() {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
      this.changeLanguage(savedLang);
    } else {
      this.changeLanguage('en');
    }
  }

  ngOnDestroy() {
    this.closeVideo();
  }

  triggerAutomaticVideo(): void {
    this.showPreview();
    this.showVideo();
  }

  getUserByUsername(key: string) {
    if (!key) return;
    this.affiliateService
      .getAffiliateByUserName(key)
      .subscribe((user: UserAffiliate) => {
        if (user !== null) {
          this.user = user;
        }
      });
  }

  changeLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.isLanguageDropdownOpen = false;
  }

  toggleLanguageDropdown(event: Event) {
    event.stopPropagation();
    this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: any) {
    const clickedElement = event.target as HTMLElement;
    const isLanguageSelector = clickedElement.closest('.language-selector');
    if (!isLanguageSelector) {
      this.isLanguageDropdownOpen = false;
    }
  }

  showDocument(
    docType: 'whitePaper' | 'legalDoc' | 'exitojuntosProject',
  ): void {
    const document = this.documents[docType];
    this.pdfViewerService.showPdf(document);
  }

  toggleNavbar() {
    this.isNavbarVisible = !this.isNavbarVisible;
  }

  openNewTab(url: string) {
    window.open(url, '_blank');
  }

  showVideo(): void {
    const videoId = this.videos[this.currentLang].url;

    this.currentVideoUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
    this.showVideoModal = true;
  }

  closeVideo(): void {
    this.showVideoModal = false;
    this.currentVideoUrl = '';
    document.body.style.overflow = 'auto';
    this.hidePreview();
  }

  showPreview(): void {
    this.isPreviewHovered = true;
  }

  hidePreview(): void {
    this.isPreviewHovered = false;
  }

  getCurrentFlagIcon(): string {
    return this.languageFlags[this.currentLang] || this.languageFlags['en'];
  }
}
