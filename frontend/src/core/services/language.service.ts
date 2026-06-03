import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'renault_lang';

export type Lang = 'en' | 'tr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _current = signal<Lang>(this.loadPreference());
  readonly current = this._current.asReadonly();

  constructor(private readonly translate: TranslateService) {
    translate.addLangs(['en', 'tr']);
    translate.setDefaultLang('en');
    translate.use(this._current());
  }

  switch(lang: Lang): void {
    this._current.set(lang);
    this.translate.use(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  toggle(): void {
    this.switch(this._current() === 'en' ? 'tr' : 'en');
  }

  private loadPreference(): Lang {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
    return navigator.language.startsWith('tr') ? 'tr' : 'en';
  }
}
