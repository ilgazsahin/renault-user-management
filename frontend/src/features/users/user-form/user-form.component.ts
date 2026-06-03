import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { CreateUserDto, UpdateUserDto } from '../../../core/models/user.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = signal(false);
  userId = signal<string | null>(null);
  loading = signal(false);
  loadingUser = signal(false);
  errorMessage = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const isEdit = id !== null && this.route.snapshot.url.some((s) => s.path === 'edit');

    this.isEditMode.set(isEdit);
    this.userId.set(id);

    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      ...(isEdit && { password: ['', [Validators.minLength(6)]] }),
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', [Validators.required]],
    });

    if (isEdit && id) {
      this.loadingUser.set(true);
      this.userService.getUser(id).subscribe({
        next: (user) => {
          this.form.patchValue({
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          });
          this.loadingUser.set(false);
        },
        error: () => {
          this.errorMessage.set(this.translate.instant('USER_FORM.LOAD_FAILED'));
          this.loadingUser.set(false);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const values = this.form.value as {
      username: string;
      password?: string;
      fullName: string;
      email: string;
      role: 'admin' | 'user';
    };

    if (this.isEditMode() && this.userId()) {
      const dto: UpdateUserDto = {
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
      };
      if (values.password?.trim()) {
        dto.password = values.password;
      }

      this.userService.updateUser(this.userId()!, dto).subscribe({
        next: (user) => {
          void this.router.navigate(['/users', user.id]);
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          const raw = err?.error?.message;
          this.errorMessage.set(Array.isArray(raw) ? raw.join(', ') : (raw ?? 'Failed to update user'));
          this.loading.set(false);
        },
      });
    } else {
      const dto: CreateUserDto = {
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
      };

      this.userService.createUser(dto).subscribe({
        next: () => {
          void this.router.navigate(['/users']);
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          const raw = err?.error?.message;
          this.errorMessage.set(Array.isArray(raw) ? raw.join(', ') : (raw ?? 'Failed to create user'));
          this.loading.set(false);
        },
      });
    }
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(error));
  }
}
