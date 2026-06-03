import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuditService } from '../../core/services/audit.service';
import { AuditLog, AuditAction } from '../../core/models/audit.model';
import { AuditDetailDialogComponent } from './audit-detail-dialog.component';

const ACTION_ICON: Record<AuditAction, string> = {
  USER_CREATED:     'person_add',
  USER_UPDATED:     'edit',
  USER_DELETED:     'person_remove',
  PASSWORD_CHANGED: 'lock_reset',
};

const ACTION_COLOR: Record<AuditAction, string> = {
  USER_CREATED:     'var(--r-success)',
  USER_UPDATED:     '#1976D2',
  USER_DELETED:     'var(--r-danger)',
  PASSWORD_CHANGED: '#F57C00',
};

const ALL_ACTIONS: AuditAction[] = [
  'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PASSWORD_CHANGED',
];

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogModule,
    TranslateModule,
  ],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent implements OnInit, OnDestroy {
  @ViewChild('performerInput') performerInputRef!: ElementRef<HTMLInputElement>;

  logs         = signal<AuditLog[]>([]);
  total        = signal(0);
  page         = signal(1);
  pageSize     = signal(20);
  loading      = signal(true);
  errorMessage = signal('');

  actionFilter = signal<AuditAction | ''>('');
  performedBy  = signal('');
  dateFrom     = signal<Date | null>(null);
  dateTo       = signal<Date | null>(null);
  sortOrder    = signal<'ASC' | 'DESC'>('DESC');

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);
  readonly hasFilters = computed(() =>
    this.actionFilter() !== '' || this.performedBy() !== '' ||
    this.dateFrom() !== null   || this.dateTo()   !== null
  );
  readonly allActions = ALL_ACTIONS;
  readonly displayedColumns = ['action', 'performedBy', 'target', 'metadata', 'createdAt', 'actions'];

  readonly actionIcon  = (a: AuditAction) => ACTION_ICON[a];
  readonly actionColor = (a: AuditAction) => ACTION_COLOR[a];

  private readonly performedBy$ = new Subject<string>();
  private readonly destroy$     = new Subject<void>();

  constructor(
    private readonly auditService: AuditService,
    private readonly translate: TranslateService,
    private readonly dialog: MatDialog,
  ) {}

  openDetail(log: AuditLog): void {
    this.dialog.open(AuditDetailDialogComponent, {
      width: '560px',
      data: log,
    });
  }

  ngOnInit(): void {
    this.performedBy$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((v) => {
      this.performedBy.set(v);
      this.page.set(1);
      this.loadLogs();
    });

    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPerformedByInput(value: string): void {
    this.performedBy$.next(value);
  }

  onActionFilter(action: AuditAction | ''): void {
    this.actionFilter.set(action);
    this.page.set(1);
    this.loadLogs();
  }

  onDateFromChange(event: MatDatepickerInputEvent<Date>): void {
    this.dateFrom.set(event.value ?? null);
    this.page.set(1);
    this.loadLogs();
  }

  onDateToChange(event: MatDatepickerInputEvent<Date>): void {
    this.dateTo.set(event.value ?? null);
    this.page.set(1);
    this.loadLogs();
  }

  toggleSortOrder(): void {
    this.sortOrder.set(this.sortOrder() === 'DESC' ? 'ASC' : 'DESC');
    this.page.set(1);
    this.loadLogs();
  }

  resetFilters(): void {
    this.actionFilter.set('');
    this.performedBy.set('');
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.page.set(1);
    this.performerInputRef.nativeElement.value = '';
    this.loadLogs();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadLogs();
  }

  actionLabel(action: AuditAction): string {
    return this.translate.instant(`AUDIT.ACTION.${action}`);
  }

  metadataSummary(log: AuditLog): string {
    const m = log.metadata;
    if (!m || Object.keys(m).length === 0) return '—';

    if (log.action === 'USER_CREATED') {
      return `${m['fullName'] as string} · ${m['role'] as string}`;
    }
    if (log.action === 'USER_UPDATED') {
      const fields = m['changedFields'] as Record<string, unknown>;
      if (!fields || Object.keys(fields).length === 0) return '—';
      return Object.keys(fields)
        .map((k) => (k === 'password' ? 'password: ***' : `${k}: ${fields[k] as string}`))
        .join(', ');
    }
    if (log.action === 'USER_DELETED') {
      return `${m['fullName'] as string} · ${m['email'] as string}`;
    }
    return '—';
  }

  private toIsoDate(d: Date | null): string {
    if (!d) return '';
    return d.toISOString().split('T')[0];
  }

  private loadLogs(): void {
    this.loading.set(true);
    this.auditService.getLogs({
      page:        this.page(),
      limit:       this.pageSize(),
      action:      this.actionFilter(),
      performedBy: this.performedBy(),
      dateFrom:    this.toIsoDate(this.dateFrom()),
      dateTo:      this.toIsoDate(this.dateTo()),
      sortOrder:   this.sortOrder(),
    }).subscribe({
      next: (res) => {
        this.logs.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('AUDIT.LOAD_FAILED'));
        this.loading.set(false);
      },
    });
  }
}
