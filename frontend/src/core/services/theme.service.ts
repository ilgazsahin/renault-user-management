import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY = 'renault_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal<boolean>(this.loadPreference());

  readonly isDark = this._isDark.asReadonly();
  readonly icon = computed(() => (this._isDark() ? 'light_mode' : 'dark_mode'));
  readonly label = computed(() => (this._isDark() ? 'Light mode' : 'Dark mode'));

  constructor() {
    this.applyTheme(this._isDark());
  }

  toggle(): void {
    const next = !this._isDark();
    this._isDark.set(next);
    this.applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark-theme', dark);
  }

  private loadPreference(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
