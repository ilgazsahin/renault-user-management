import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideTranslateService, TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

function renaultPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return '0 of 0';
    const end = Math.min((page + 1) * pageSize, length);
    return `${end} of ${length}`;
  };
  return intl;
}

class JsonTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  getTranslation(lang: string): Observable<TranslationObject> {
    return this.http.get<TranslationObject>(`/i18n/${lang}.json`);
  }
}

function translateLoaderFactory(http: HttpClient): JsonTranslateLoader {
  return new JsonTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter(),
    { provide: MatPaginatorIntl, useFactory: renaultPaginatorIntl },
    provideTranslateService({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
};
