import { Component, Inject } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { AuditLog, AuditAction } from '../../core/models/audit.model';

const ACTION_ICON: Record<AuditAction, string> = {
  USER_CREATED:     'person_add',
  USER_UPDATED:     'edit',
  USER_DELETED:     'person_remove',
  PASSWORD_CHANGED: 'lock_reset',
};

const ACTION_COLOR: Record<AuditAction, string> = {
  USER_CREATED:     '#2E7D32',
  USER_UPDATED:     '#1976D2',
  USER_DELETED:     '#D32F2F',
  PASSWORD_CHANGED: '#F57C00',
};

const ACTION_BG: Record<AuditAction, string> = {
  USER_CREATED:     'rgba(46,125,50,0.08)',
  USER_UPDATED:     'rgba(25,118,210,0.08)',
  USER_DELETED:     'rgba(211,47,47,0.08)',
  PASSWORD_CHANGED: 'rgba(245,124,0,0.08)',
};

@Component({
  selector: 'app-audit-detail-dialog',
  standalone: true,
  imports: [DatePipe, KeyValuePipe, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, TranslateModule],
  template: `
    <div class="detail-header" [style.background]="bg">
      <div class="detail-action-badge" [style.color]="color">
        <mat-icon>{{ icon }}</mat-icon>
        <span>{{ 'AUDIT.ACTION.' + log.action | translate }}</span>
      </div>
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="detail-content">

      <!-- Meta fields -->
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">{{ 'AUDIT.COL_PERFORMED_BY' | translate }}</span>
          <span class="detail-value">{{ log.performedByUsername }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ 'AUDIT.COL_TARGET' | translate }}</span>
          <span class="detail-value">{{ log.targetUsername || '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ 'AUDIT.COL_DATE' | translate }}</span>
          <span class="detail-value">{{ log.createdAt | date:'dd MMM yyyy, HH:mm:ss' }}</span>
        </div>
      </div>

      <mat-divider style="margin: 20px 0;"></mat-divider>

      <!-- Metadata -->
      <p class="detail-section-title">{{ 'AUDIT.DETAIL_METADATA' | translate }}</p>

      @if (log.action === 'PASSWORD_CHANGED') {
        <p class="detail-empty">{{ 'AUDIT.DETAIL_NO_METADATA' | translate }}</p>
      } @else if (log.action === 'USER_UPDATED') {
        @if (changedFields.length === 0) {
          <p class="detail-empty">{{ 'AUDIT.DETAIL_NO_CHANGES' | translate }}</p>
        } @else {
          <div class="metadata-table">
            @for (field of changedFields; track field.key) {
              <div class="metadata-row">
                <span class="meta-key">{{ field.key }}</span>
                <span class="meta-value">{{ field.key === 'password' ? '***' : field.value }}</span>
              </div>
            }
          </div>
        }
      } @else {
        <div class="metadata-table">
          @for (entry of metaEntries; track entry.key) {
            <div class="metadata-row">
              <span class="meta-key">{{ entry.key }}</span>
              <span class="meta-value">{{ entry.value }}</span>
            </div>
          }
        </div>
      }

    </mat-dialog-content>

    <mat-dialog-actions align="end" style="padding: 12px 24px;">
      <button mat-button mat-dialog-close>{{ 'CONFIRM.CANCEL' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-radius: 8px 8px 0 0;
    }

    .detail-action-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;

      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }

    .close-btn { color: var(--r-text-secondary) !important; }

    .detail-content {
      padding: 0 24px 8px !important;
      min-width: 440px;
      max-width: 560px;
    }

    .detail-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .detail-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--r-text-secondary);
      flex-shrink: 0;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--r-text);
      text-align: right;
    }

    .detail-section-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--r-text-secondary);
      margin: 0 0 12px;
    }

    .metadata-table {
      border: 1px solid var(--r-border);
      border-radius: 4px;
      overflow: hidden;
    }

    .metadata-row {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      gap: 16px;

      &:not(:last-child) { border-bottom: 1px solid var(--r-border); }
      &:nth-child(even) { background: var(--r-surface-hover); }
    }

    .meta-key {
      font-size: 12px;
      font-weight: 600;
      color: var(--r-text-secondary);
      text-transform: lowercase;
      width: 130px;
      flex-shrink: 0;
    }

    .meta-value {
      font-size: 13px;
      color: var(--r-text);
      word-break: break-all;
    }

    .detail-empty {
      font-size: 13px;
      color: var(--r-text-secondary);
      margin: 0;
      font-style: italic;
    }
  `],
})
export class AuditDetailDialogComponent {
  readonly icon  = ACTION_ICON[this.log.action];
  readonly color = ACTION_COLOR[this.log.action];
  readonly bg    = ACTION_BG[this.log.action];

  readonly changedFields: { key: string; value: string }[] = this.log.action === 'USER_UPDATED'
    ? Object.entries((this.log.metadata['changedFields'] as Record<string, unknown>) ?? {})
        .map(([key, value]) => ({ key, value: String(value) }))
    : [];

  readonly metaEntries: { key: string; value: string }[] =
    Object.entries(this.log.metadata ?? {})
      .map(([key, value]) => ({ key, value: String(value) }));

  constructor(@Inject(MAT_DIALOG_DATA) readonly log: AuditLog) {}
}
