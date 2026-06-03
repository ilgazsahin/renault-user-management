import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from '../mail/mail.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from './dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

export interface PaginatedUsers {
  data: SafeUser[];
  total: number;
  page: number;
  limit: number;
}

const SALT_ROUNDS = 10;

type SafeUser = Omit<User, 'password'>;

const SAFE_SELECT: (keyof User)[] = [
  'id', 'username', 'fullName', 'email', 'role', 'createdAt', 'updatedAt',
];

interface Performer {
  id: string;
  username: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedUsers> {
    const page      = pagination.page      ?? 1;
    const limit     = pagination.limit     ?? 10;
    const sortBy    = pagination.sortBy    ?? 'createdAt';
    const sortOrder = pagination.sortOrder ?? 'DESC';

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .select(SAFE_SELECT.map((f) => `user.${f}`))
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`user.${sortBy}`, sortOrder);

    if (pagination.search?.trim()) {
      const term = `%${pagination.search.trim().toLowerCase()}%`;
      qb.where(
        'LOWER(user.fullName) LIKE :term OR LOWER(user.username) LIKE :term',
        { term },
      );
    }

    if (pagination.role) {
      qb.andWhere('user.role = :role', { role: pagination.role });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async resetPasswordByEmail(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return; // silent — do not reveal whether the email exists

    const tempPassword = randomBytes(8).toString('hex');
    user.password = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    await this.usersRepository.save(user);

    await this.mailService.sendPasswordResetEmail(user.email, user.username, tempPassword);
  }

  async create(dto: CreateUserDto, sendEmail = true, performer?: Performer): Promise<SafeUser> {
    const byUsername = await this.usersRepository.findOne({
      where: { username: dto.username },
    });
    if (byUsername) {
      throw new ConflictException(`Username "${dto.username}" is already taken`);
    }

    const byEmail = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (byEmail) {
      throw new ConflictException(`Email "${dto.email}" is already registered`);
    }

    const tempPassword = dto.password ?? randomBytes(8).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    const user = this.usersRepository.create({ ...dto, password: hashed });
    const saved = await this.usersRepository.save(user);

    if (sendEmail) {
      await this.mailService.sendWelcomeEmail(saved.email, saved.username, tempPassword);
    }

    if (performer) {
      await this.auditService.log({
        action: AuditAction.USER_CREATED,
        performedById: performer.id,
        performedByUsername: performer.username,
        targetUserId: saved.id,
        targetUsername: saved.username,
        metadata: { fullName: saved.fullName, email: saved.email, role: saved.role },
      });
    }

    const { password: _p, ...safeUser } = saved;
    void _p;
    return safeUser;
  }

  async update(id: string, dto: UpdateUserDto, performer?: Performer): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    if (dto.username != null && dto.username !== user.username) {
      const existing = await this.usersRepository.findOne({
        where: { username: dto.username },
      });
      if (existing) {
        throw new ConflictException(`Username "${dto.username}" is already taken`);
      }
    }

    if (dto.email != null && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException(`Email "${dto.email}" is already registered`);
      }
    }

    const changedFields: Record<string, unknown> = {};
    if (dto.username  != null && dto.username  !== user.username)  changedFields['username']  = dto.username;
    if (dto.fullName  != null && dto.fullName  !== user.fullName)  changedFields['fullName']  = dto.fullName;
    if (dto.email     != null && dto.email     !== user.email)     changedFields['email']     = dto.email;
    if (dto.role      != null && dto.role      !== user.role)      changedFields['role']      = dto.role;
    if (dto.password  != null && dto.password.length > 0)         changedFields['password']  = '***';

    if (dto.password != null && dto.password.length > 0) {
      dto = { ...dto, password: await bcrypt.hash(dto.password, SALT_ROUNDS) };
    } else {
      const { password: _p, ...rest } = dto;
      void _p;
      dto = rest;
    }

    Object.assign(user, dto);
    const saved = await this.usersRepository.save(user);

    if (performer) {
      await this.auditService.log({
        action: AuditAction.USER_UPDATED,
        performedById: performer.id,
        performedByUsername: performer.username,
        targetUserId: saved.id,
        targetUsername: saved.username,
        metadata: { changedFields },
      });
    }

    const { password: _p, ...safeUser } = saved;
    void _p;
    return safeUser;
  }

  async remove(id: string, performer: Performer): Promise<void> {
    if (id === performer.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    await this.auditService.log({
      action: AuditAction.USER_DELETED,
      performedById: performer.id,
      performedByUsername: performer.username,
      targetUserId: user.id,
      targetUsername: user.username,
      metadata: { fullName: user.fullName, email: user.email, role: user.role },
    });

    await this.usersRepository.remove(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersRepository.save(user);

    await this.auditService.log({
      action: AuditAction.PASSWORD_CHANGED,
      performedById: user.id,
      performedByUsername: user.username,
      targetUserId: user.id,
      targetUsername: user.username,
      metadata: {},
    });

    await this.mailService.sendPasswordChangedEmail(user.email, user.username);
  }

  async count(): Promise<number> {
    return this.usersRepository.count();
  }
}
