import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  public languages: string[] = ['en', 'es', 'fr', 'pt'];

  constructor(public translate: TranslateService) {
    translate.addLangs(this.languages);

    const storedLang = localStorage.getItem('lang');
    const browserLang = storedLang || translate.getBrowserLang();
    const normalizedLang = this.normalizeLanguage(browserLang);

    this.translate.use(normalizedLang);
    localStorage.setItem('lang', normalizedLang);
  }

  private normalizeLanguage(lang?: string | null): string {
    if (!lang) {
      return 'en';
    }

    const shortLang = lang.toLowerCase().split('-')[0];
    return this.languages.includes(shortLang) ? shortLang : 'en';
  }

  public setLanguage(lang: string) {
    const normalizedLang = this.normalizeLanguage(lang);
    this.translate.use(normalizedLang);
    localStorage.setItem('lang', normalizedLang);
  }
}
