import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

interface TermsItem {
  number?: string;
  text: string;
  subitems?: string[];
}

interface TermsSection {
  number: string;
  title: string;
  items: TermsItem[];
}

interface TermsConditions {
  title: string;
  subtitle: string;
  version: string;
  sections: TermsSection[];
  acceptance: {
    text: string;
    signature: string;
  };
}

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.scss'],
  providers: [],
})
export class TermsConditionsComponent implements OnInit {
  @Input() isVisible = false;
  @Output() closeModal = new EventEmitter<void>();

  termsData: TermsConditions | null = null;
  isLoading = true;
  currentLang = 'es';

  constructor(
    private readonly http: HttpClient,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    // Obtener el idioma actual desde localStorage o usar el idioma del navegador
    const storedLang = localStorage.getItem('lang');
    this.currentLang = storedLang || this.translate.getBrowserLang() || 'es';
    this.loadTermsConditions();

    // Escuchar cambios de idioma
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang || 'es';
      this.loadTermsConditions();
    });
  }

  loadTermsConditions(): void {
    this.isLoading = true;
    const fileName = `assets/data/terms-conditions-${this.currentLang}.json`;

    this.http.get<TermsConditions>(fileName).subscribe({
      next: data => {
        this.termsData = data;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading terms and conditions:', error);
        // Si falla, intentar cargar en español por defecto
        if (this.currentLang === 'es') {
          this.isLoading = false;
        } else {
          this.http
            .get<TermsConditions>('assets/data/terms-conditions-es.json')
            .subscribe({
              next: data => {
                this.termsData = data;
                this.isLoading = false;
              },
              error: () => {
                this.isLoading = false;
              },
            });
        }
      },
    });
  }

  close(): void {
    this.closeModal.emit();
  }
}
