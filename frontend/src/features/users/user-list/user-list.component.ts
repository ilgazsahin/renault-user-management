import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

type SortBy = 'fullName' | 'username' | 'createdAt';
type SortOrder = 'ASC' | 'DESC';
type RoleFilter = 'admin' | 'user' | '';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  users        = signal<User[]>([]);
  total        = signal(0);
  page         = signal(1);
  pageSize     = signal(10);
  loading      = signal(true);
  errorMessage = signal('');

  search      = signal('');
  roleFilter  = signal<RoleFilter>('');
  sortBy      = signal<SortBy>('createdAt');
  sortOrder   = signal<SortOrder>('DESC');

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);
  readonly hasFilters = computed(() => this.search() !== '' || this.roleFilter() !== '');
  readonly isAdmin    = this.authService.isAdmin;
  readonly displayedColumns = ['fullName', 'username', 'email', 'role', 'createdAt', 'actions'];

  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$     = new Subject<void>();

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((value) => {
      this.search.set(value);
      this.page.set(1);
      this.loadUsers();
    });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchInput$.next(value);
  }

  onRoleChange(role: RoleFilter): void {
    this.roleFilter.set(role);
    this.page.set(1);
    this.loadUsers();
  }

  resetFilters(): void {
    this.search.set('');
    this.roleFilter.set('');
    this.page.set(1);
    this.searchInputRef.nativeElement.value = '';
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  setSortBy(field: SortBy): void {
    if (this.sortBy() === field) {
      this.sortOrder.set(this.sortOrder() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('ASC');
    }
    this.page.set(1);
    this.loadUsers();
  }

  sortIcon(field: SortBy): string {
    if (this.sortBy() !== field) return 'unfold_more';
    return this.sortOrder() === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers(
      this.page(),
      this.pageSize(),
      this.search(),
      this.roleFilter(),
      this.sortBy(),
      this.sortOrder(),
    ).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('USERS.LOAD_FAILED'));
        this.loading.set(false);
      },
    });
  }

  confirmDelete(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: `Are you sure you want to delete "${user.fullName}"?` },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.snackBar.open(this.translate.instant('USERS.DELETED'), this.translate.instant('CONFIRM.CANCEL'), { duration: 3000 });
            const remainingOnPage = this.users().length - 1;
            if (remainingOnPage === 0 && this.page() > 1) {
              this.page.set(this.page() - 1);
            }
            this.loadUsers();
          },
          error: (err: { error?: { message?: string } }) => {
            const msg = err?.error?.message ?? 'Failed to delete user';
            this.snackBar.open(msg, 'Close', { duration: 4000 });
          },
        });
      }
    });
  }
}
