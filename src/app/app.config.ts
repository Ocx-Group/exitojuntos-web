import {
  ApplicationConfig,
  importProvidersFrom,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  provideHttpClient,
  HttpClient,
  withInterceptors,
} from '@angular/common/http';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';

// Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { firebaseConfig } from '@environments/environment';

// Translate
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// Loading Bar
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';

// Toastr
import { provideToastr } from 'ngx-toastr';

// Interceptor
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Routes
import { routes } from './app.routes';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    // Note: Animations are now handled through animate.enter/animate.leave APIs in components
    // No global provider needed in Angular 20+
    provideHttpClient(withInterceptors([authInterceptor])),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
    }),
    { provide: LocationStrategy, useClass: PathLocationStrategy },

    // Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideStorage(() => getStorage()),

    // Translate
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
      LoadingBarRouterModule,
    ),

    // Language initialization
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      translate.setFallbackLang('en');
      const savedLang = localStorage.getItem('lang') || 'en';
      translate.use(savedLang);
      localStorage.setItem('lang', savedLang);
    }),
  ],
};
