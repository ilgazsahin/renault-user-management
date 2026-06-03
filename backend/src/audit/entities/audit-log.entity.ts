import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuditAction {
  USER_CREATED  = 'USER_CREATED',
  USER_UPDATED  = 'USER_UPDATED',
  USER_DELETED  = 'USER_DELETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column()
  performedById!: string;

  @Column()
  performedByUsername!: string;

  @Column({ nullable: true })
  targetUserId!: string;

  @Column({ nullable: true })
  targetUsername!: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
