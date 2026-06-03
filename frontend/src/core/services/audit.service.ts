import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditAction, PaginatedAuditLogs } from '../models/audit.model';
import { environment } from '../../environments/environment';

export interface AuditFilters {
  page?: number;
  limit?: number;
  action?: AuditAction | '';
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly baseUrl = `${environment.apiUrl}/audit`;

  constructor(private readonly http: HttpClient) {}

  getLogs(filters: AuditFilters = {}): Observable<PaginatedAuditLogs> {
    const params: Record<string, string> = {
      page:      String(filters.page  ?? 1),
      limit:     String(filters.limit ?? 20),
      sortOrder: filters.sortOrder ?? 'DESC',
    };
    if (filters.action)              params['action']      = filters.action;
    if (filters.performedBy?.trim()) params['performedBy'] = filters.performedBy.trim();
    if (filters.dateFrom)            params['dateFrom']    = filters.dateFrom;
    if (filters.dateTo)              params['dateTo']      = filters.dateTo;
    return this.http.get<PaginatedAuditLogs>(this.baseUrl, { params });
  }
}
