import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

export interface LogEntry {
  action: AuditAction;
  performedById: string;
  performedByUsername: string;
  targetUserId?: string;
  targetUsername?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  action?: AuditAction;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(entry: LogEntry): Promise<void> {
    await this.repo.save(this.repo.create(entry));
  }

  async findAll(filters: AuditFilters = {}): Promise<PaginatedAuditLogs> {
    const page      = filters.page      ?? 1;
    const limit     = filters.limit     ?? 20;
    const sortOrder = filters.sortOrder ?? 'DESC';

    const qb = this.repo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters.performedBy?.trim()) {
      qb.andWhere('LOWER(log.performedByUsername) LIKE :performer', {
        performer: `%${filters.performedBy.trim().toLowerCase()}%`,
      });
    }

    if (filters.dateFrom) {
      qb.andWhere('log.createdAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters.dateTo) {
      // include the full end day up to 23:59:59
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('log.createdAt <= :dateTo', { dateTo: end });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }
}
