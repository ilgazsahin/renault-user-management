export type AuditAction = 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'PASSWORD_CHANGED';

export interface AuditLog {
  id: string;
  action: AuditAction;
  performedById: string;
  performedByUsername: string;
  targetUserId: string;
  targetUsername: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
