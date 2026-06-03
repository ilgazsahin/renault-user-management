import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { LanguageService } from '../core/services/language.service';
import { ChangePasswordComponent } from '../features/users/change-password/change-password.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatDividerModule, MatDialogModule,
    TranslateModule,
  ],
  template: `
    @if (isAuthenticated()) {
      <mat-toolbar class="renault-toolbar">

        <a class="toolbar-brand" routerLink="/users">
          <img src="RNO.PA.D-fef2ec73.png" alt="Renault" height="36" style="display:block;" />
          <div class="toolbar-title">
            <span class="brand-name">Renault</span>
          </div>
        </a>

        <span class="spacer"></span>

        <div class="toolbar-nav">
          <a mat-button routerLink="/users" class="nav-link" routerLinkActive="nav-link-active">
            <mat-icon>people</mat-icon>
            <span class="nav-link-label">{{ 'NAV.USERS' | translate }}</span>
          </a>
          @if (isAdmin()) {
            <a mat-button routerLink="/activity" class="nav-link" routerLinkActive="nav-link-active">
              <mat-icon>history</mat-icon>
              <span class="nav-link-label">{{ 'NAV.ACTIVITY' | translate }}</span>
            </a>
          }
        </div>

        <div class="toolbar-divider"></div>

        <!-- Language toggle -->
        <button mat-button class="lang-btn"
          (click)="langService.toggle()">
          {{ langService.current() === 'en' ? 'TR' : 'EN' }}
        </button>

        <!-- User dropdown -->
        <button mat-button class="user-menu-btn" [matMenuTriggerFor]="userMenu">
          <mat-icon class="user-menu-icon">account_circle</mat-icon>
          <span class="user-menu-name">{{ displayName() }}</span>
          <mat-icon class="user-menu-chevron">expand_more</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" class="user-dropdown" xPosition="before">
          <!-- Profile header -->
          <div class="menu-profile-header" (click)="$event.stopPropagation()">
            <div class="menu-avatar">{{ avatarLetter() }}</div>
            <div>
              <div class="menu-profile-name">{{ displayName() }}</div>
              <div class="menu-profile-role">{{ isAdmin() ? ('ROLES.admin' | translate) : ('ROLES.user' | translate) }}</div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <a mat-menu-item [routerLink]="['/users', currentUserId()]">
            <mat-icon>person</mat-icon>
            {{ 'NAV.VIEW_PROFILE' | translate }}
          </a>

          <button mat-menu-item (click)="openChangePassword()">
            <mat-icon>lock_outline</mat-icon>
            {{ 'NAV.CHANGE_PASSWORD' | translate }}
          </button>

          <mat-divider></mat-divider>

          <button mat-menu-item (click)="themeService.toggle()">
            <mat-icon>{{ themeService.icon() }}</mat-icon>
            {{ (themeService.isDark() ? 'NAV.LIGHT_MODE' : 'NAV.DARK_MODE') | translate }}
          </button>

          <mat-divider></mat-divider>

          <button mat-menu-item class="menu-logout" (click)="logout()">
            <mat-icon>logout</mat-icon>
            {{ 'NAV.LOGOUT' | translate }}
          </button>
        </mat-menu>

      </mat-toolbar>
    }
    <router-outlet />
  `,
  styles: [`
    .lang-btn {
      color: #ffffff !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      letter-spacing: 0.08em !important;
      min-width: 36px !important;
      padding: 0 8px !important;
      border: 1px solid rgba(255,255,255,0.25) !important;
      border-radius: 4px !important;
      height: 32px !important;
      line-height: 32px !important;
      transition: border-color 0.2s, color 0.2s !important;
      &:hover { border-color: #EFDF00 !important; color: #EFDF00 !important; }
    }

    .user-menu-btn {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      color: #ffffff !important;
      padding: 0 10px !important;
      height: 40px !important;
      border-radius: 6px !important;
      transition: background 0.2s !important;
      &:hover { background: rgba(255,255,255,0.08) !important; }
    }

    .user-menu-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; color: #9E9E9E !important; }
    .user-menu-name { font-size: 13px !important; font-weight: 500 !important; letter-spacing: 0.02em !important; }
    .user-menu-chevron { font-size: 18px !important; width: 18px !important; height: 18px !important; color: #9E9E9E !important; }

    .menu-profile-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
    }

    .menu-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #EFDF00;
      color: #1A1A1A;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      text-transform: uppercase;
    }

    .menu-profile-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--r-text);
    }

    .menu-profile-role {
      font-size: 11px;
      color: var(--r-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }
  `],
})
export class AppComponent {
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isAdmin         = this.authService.isAdmin;
  readonly displayName     = computed(() => this.authService.currentUser()?.username ?? '');
  readonly currentUserId   = computed(() => this.authService.currentUser()?.sub ?? '');
  readonly avatarLetter    = computed(() => (this.authService.currentUser()?.username ?? '?')[0]);

  constructor(
    private readonly authService: AuthService,
    readonly themeService: ThemeService,
    readonly langService: LanguageService,
    private readonly dialog: MatDialog,
  ) {}

  openChangePassword(): void {
    this.dialog.open(ChangePasswordComponent, { width: '440px' });
  }

  logout(): void {
    this.authService.logout();
  }
}
