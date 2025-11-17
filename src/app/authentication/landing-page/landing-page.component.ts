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
  heroMetrics = [
    { value: '98%', label: '' },
    { value: '$500M+', label: '' },
    { value: '10K+', label: '' },
  ];
  featureCards = [
    {
      icon: 'fa-chart-line',
      title: '',
      description: '',
    },
    {
      icon: 'fa-shield-alt',
      title: '',
      description: '',
    },
    {
      icon: 'fa-chart-pie',
      title: '',
      description: '',
    },
    {
      icon: 'fa-user-tie',
      title: '',
      description: '',
    },
    {
      icon: 'fa-eye',
      title: '',
      description: '',
    },
    {
      icon: 'fa-headset',
      title: '',
      description: '',
    },
  ];
  readonly tradingImage = 'assets/images/TradingSection.png';
  tradingHighlights: string[] = [];
  readonly checkIcon = 'fa-check';
  processSteps = [
    {
      number: '01',
      icon: 'fa-user-plus',
      title: '',
      description: '',
    },
    {
      number: '02',
      icon: 'fa-clipboard-list',
      title: '',
      description: '',
    },
    {
      number: '03',
      icon: 'fa-coins',
      title: '',
      description: '',
    },
    {
      number: '04',
      icon: 'fa-chart-area',
      title: '',
      description: '',
    },
  ];
  testimonials = [
    {
      quote: '',
      avatar: 'assets/images/user.png',
      name: '',
      role: '',
      rating: 5,
    },
    {
      quote: '',
      avatar: 'assets/images/user.png',
      name: '',
      role: '',
      rating: 5,
    },
    {
      quote: '',
      avatar: 'assets/images/user.png',
      name: '',
      role: '',
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
  ctaStats = [
    { value: 'A+', label: '' },
    { value: '100%', label: '' },
    { value: '24/7', label: '' },
  ];
  readonly footerLinks = [
    {
      key: 'LINKS',
      heading: 'Enlaces',
      items: [
        { key: 'SERVICES', label: '', href: '#servicios' },
        { key: 'ABOUT_US', label: '', href: '#nosotros' },
        { key: 'TESTIMONIALS', label: '', href: '#testimonios' },
        { key: 'CONTACT', label: '', href: '#contacto' },
      ],
    },
    {
      key: 'LEGAL',
      heading: 'Legal',
      items: [
        { key: 'PRIVACY', label: '', href: '#privacidad' },
        { key: 'TERMS', label: '', href: '#terminos' },
        { key: 'REGULATION', label: '', href: '#regulacion' },
        { key: 'SECURITY', label: '', href: '#seguridad' },
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
    this.updateTranslations();
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
    this.updateTranslations();
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

  updateTranslations(): void {
    // Update hero metrics
    this.translate.get('LANDING_PAGE.HERO.METRICS').subscribe(metrics => {
      this.heroMetrics = [
        { value: '98%', label: metrics.PROFITABILITY },
        { value: '$500M+', label: metrics.MANAGED },
        { value: '10K+', label: metrics.INVESTORS },
      ];
    });

    // Update feature cards
    this.translate.get('LANDING_PAGE.FEATURES.CARDS').subscribe(cards => {
      this.featureCards[0].title = cards.TRADING.TITLE;
      this.featureCards[0].description = cards.TRADING.DESCRIPTION;
      this.featureCards[1].title = cards.SECURITY.TITLE;
      this.featureCards[1].description = cards.SECURITY.DESCRIPTION;
      this.featureCards[2].title = cards.ANALYSIS.TITLE;
      this.featureCards[2].description = cards.ANALYSIS.DESCRIPTION;
      this.featureCards[3].title = cards.ADVISORY.TITLE;
      this.featureCards[3].description = cards.ADVISORY.DESCRIPTION;
      this.featureCards[4].title = cards.TRANSPARENCY.TITLE;
      this.featureCards[4].description = cards.TRANSPARENCY.DESCRIPTION;
      this.featureCards[5].title = cards.SUPPORT.TITLE;
      this.featureCards[5].description = cards.SUPPORT.DESCRIPTION;
    });

    // Update trading highlights
    this.translate
      .get('LANDING_PAGE.TRADING_SECTION.HIGHLIGHTS')
      .subscribe(highlights => {
        this.tradingHighlights = [
          highlights.ITEM1,
          highlights.ITEM2,
          highlights.ITEM3,
          highlights.ITEM4,
        ];
      });

    // Update process steps
    this.translate.get('LANDING_PAGE.HOW_IT_WORKS.STEPS').subscribe(steps => {
      this.processSteps[0].title = steps.STEP1.TITLE;
      this.processSteps[0].description = steps.STEP1.DESCRIPTION;
      this.processSteps[1].title = steps.STEP2.TITLE;
      this.processSteps[1].description = steps.STEP2.DESCRIPTION;
      this.processSteps[2].title = steps.STEP3.TITLE;
      this.processSteps[2].description = steps.STEP3.DESCRIPTION;
      this.processSteps[3].title = steps.STEP4.TITLE;
      this.processSteps[3].description = steps.STEP4.DESCRIPTION;
    });

    // Update CTA stats
    this.translate.get('LANDING_PAGE.CTA_SECTION.STATS').subscribe(stats => {
      this.ctaStats = [
        { value: 'A+', label: stats.RATING },
        { value: '100%', label: stats.SECURE },
        { value: '24/7', label: stats.SUPPORT },
      ];
    });

    // Update footer links
    this.translate.get('LANDING_PAGE.FOOTER.LINKS').subscribe(links => {
      this.footerLinks[0].items[0].label = links.SERVICES;
      this.footerLinks[0].items[1].label = links.ABOUT_US;
      this.footerLinks[0].items[2].label = links.TESTIMONIALS;
      this.footerLinks[0].items[3].label = links.CONTACT;
    });

    this.translate.get('LANDING_PAGE.FOOTER.LEGAL').subscribe(legal => {
      this.footerLinks[1].items[0].label = legal.PRIVACY;
      this.footerLinks[1].items[1].label = legal.TERMS;
      this.footerLinks[1].items[2].label = legal.REGULATION;
      this.footerLinks[1].items[3].label = legal.SECURITY;
    });

    // Update testimonials
    this.translate
      .get('LANDING_PAGE.TESTIMONIALS_SECTION.TESTIMONIALS')
      .subscribe((testimonials: any[]) => {
        for (let index = 0; index < testimonials.length; index++) {
          if (this.testimonials[index]) {
            this.testimonials[index].quote = testimonials[index].QUOTE;
            this.testimonials[index].name = testimonials[index].NAME;
            this.testimonials[index].role = testimonials[index].ROLE;
          }
        }
      });
  }
}
