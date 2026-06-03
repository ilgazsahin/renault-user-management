import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

type View = 'login' | 'forgot' | 'forgot-success';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './login.component.html',
  styles: [`
    .login-root {
      display: flex;
      min-height: 100vh;
    }

    .login-panel-left {
      width: 420px;
      min-width: 420px;
      background: #1A1A1A;
      display: flex;
      flex-direction: column;
      padding: 48px 40px;
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .left-brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #FFFFFF;
    }

    .left-copy {
      margin-top: auto;
      margin-bottom: auto;
      padding: 40px 0;
    }

    .left-copy h2 {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.2;
      color: #FFFFFF;
      margin: 0 0 16px;
    }

    .left-copy p {
      font-size: 15px;
      color: #9E9E9E;
      line-height: 1.6;
      margin: 0;
    }

    .left-footer {
      font-size: 12px;
      color: #555;
      letter-spacing: 0.05em;
    }

    .login-panel-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F4F4F4;
      padding: 48px 24px;
    }

    .login-form-box {
      width: 100%;
      max-width: 400px;
    }

    .form-title {
      font-size: 28px;
      font-weight: 700;
      color: #1A1A1A;
      margin: 0 0 6px;
    }

    .form-subtitle {
      font-size: 14px;
      color: #9E9E9E;
      margin: 0 0 28px;
    }

    .login-btn {
      width: 100%;
      height: 48px;
      margin-top: 16px;
      font-size: 14px;
      letter-spacing: 0.08em;
    }

    .forgot-link {
      display: block;
      text-align: right;
      margin-top: 10px;
      font-size: 13px;
      color: #9E9E9E;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      font-family: 'Outfit', sans-serif;
      transition: color 0.2s;
      &:hover { color: #1A1A1A; }
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #9E9E9E;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0 0 20px;
      font-family: 'Outfit', sans-serif;
      transition: color 0.2s;
      &:hover { color: #1A1A1A; }
    }

    .success-box {
      text-align: center;
      padding: 32px 0;

      .success-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #EFDF00;
        margin-bottom: 20px;
      }

      h2 { font-size: 22px; font-weight: 700; color: #1A1A1A; margin: 0 0 10px; }
      p  { font-size: 14px; color: #757575; line-height: 1.6; margin: 0 0 28px; }
    }

    @media (max-width: 720px) {
      .login-panel-left { display: none; }
    }
  `],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  forgotForm: FormGroup;
  view = signal<View>('login');
  loading = signal(false);
  errorMessage = signal('');
  readonly year = new Date().getFullYear();

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly translate: TranslateService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/users']);
    }
  }

  showForgot(): void {
    this.view.set('forgot');
    this.errorMessage.set('');
    this.forgotForm.reset();
  }

  showLogin(): void {
    this.view.set('login');
    this.errorMessage.set('');
    this.loginForm.reset();
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    const { username, password } = this.loginForm.value as { username: string; password: string };
    this.authService.login({ username, password }).subscribe({
      next: () => void this.router.navigate(['/users']),
      error: () => {
        this.loading.set(false);
        this.errorMessage.set(this.translate.instant('LOGIN.ERROR'));
      },
    });
  }

  onForgotSubmit(): void {
    if (this.forgotForm.invalid) { this.forgotForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    const { email } = this.forgotForm.value as { email: string };
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.view.set('forgot-success');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set(this.translate.instant('LOGIN.FORGOT_ERROR'));
      },
    });
  }
}
