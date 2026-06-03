import { Component, signal } from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../core/services/user.service';
import { evaluateStrength, StrengthResult } from './strength.util';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const np = group.get('newPassword')?.value as string;
  const cp = group.get('confirmPassword')?.value as string;
  return np && cp && np !== cp ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'CHANGE_PWD.TITLE' | translate }}</h2>

    <mat-dialog-content style="min-width:380px; padding-top:8px;">
      @if (errorMessage()) { <div class="error-banner">{{ errorMessage() }}</div> }
      @if (successMessage()) { <div class="success-banner">{{ successMessage() }}</div> }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" id="cpForm">
        <mat-form-field appearance="outline" style="width:100%;">
          <mat-label>{{ 'CHANGE_PWD.CURRENT' | translate }}</mat-label>
          <input matInput type="password" formControlName="currentPassword" />
          @if (hasError('currentPassword','required')) {
            <mat-error>{{ 'CHANGE_PWD.V_CURRENT_REQUIRED' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-top:8px;">
          <mat-label>{{ 'CHANGE_PWD.NEW' | translate }}</mat-label>
          <input matInput type="password" formControlName="newPassword" (input)="onPasswordInput()" />
          @if (hasError('newPassword','required')) {
            <mat-error>{{ 'CHANGE_PWD.V_NEW_REQUIRED' | translate }}</mat-error>
          }
          @if (hasError('newPassword','minlength')) {
            <mat-error>{{ 'CHANGE_PWD.V_NEW_MIN' | translate }}</mat-error>
          }
        </mat-form-field>

        @if (strength().score > 0) {
          <div style="margin:-4px 0 16px;">
            <div style="display:flex; gap:6px; margin-bottom:6px;">
              @for (seg of [1,2,3]; track seg) {
                <div style="flex:1; height:4px; border-radius:2px; transition:background 0.3s;"
                  [style.background]="seg <= strength().score ? strength().color : 'var(--r-border)'">
                </div>
              }
            </div>
            <span style="font-size:12px; font-weight:600;" [style.color]="strength().color">
              {{ 'CHANGE_PWD.' + strength().label.toUpperCase() | translate }}
            </span>
            <span style="font-size:12px; color:var(--r-text-secondary); margin-left:6px;">
              {{ strengthHintKey() | translate }}
            </span>
          </div>
        }

        <mat-form-field appearance="outline" style="width:100%;">
          <mat-label>{{ 'CHANGE_PWD.CONFIRM' | translate }}</mat-label>
          <input matInput type="password" formControlName="confirmPassword" />
          @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
            <mat-error>{{ 'CHANGE_PWD.MISMATCH' | translate }}</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ 'CHANGE_PWD.CANCEL' | translate }}</button>
      <button mat-raised-button color="primary" type="submit" form="cpForm"
        [disabled]="form.invalid || loading()">
        @if (loading()) {
          <mat-spinner diameter="18" style="display:inline-block;"></mat-spinner>
        } @else {
          {{ 'CHANGE_PWD.SAVE' | translate }}
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class ChangePasswordComponent {
  form: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  strength = signal<StrengthResult>({ score: 0, label: '', color: '' });

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly dialogRef: MatDialogRef<ChangePasswordComponent>,
    private readonly translate: TranslateService,
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword:     ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatch },
    );
  }

  onPasswordInput(): void {
    const val = (this.form.get('newPassword')?.value as string) ?? '';
    this.strength.set(evaluateStrength(val));
  }

  strengthHintKey(): string {
    const score = this.strength().score;
    if (score === 1) return 'CHANGE_PWD.HINT_WEAK';
    if (score === 2) return 'CHANGE_PWD.HINT_MEDIUM';
    return 'CHANGE_PWD.HINT_STRONG';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');

    const { currentPassword, newPassword } = this.form.value as {
      currentPassword: string; newPassword: string;
    };

    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.successMessage.set(this.translate.instant('CHANGE_PWD.SUCCESS'));
        this.loading.set(false);
        setTimeout(() => this.dialogRef.close(true), 1500);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err?.error?.message ?? this.translate.instant('CHANGE_PWD.FAILED'));
        this.loading.set(false);
      },
    });
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(error));
  }
}
