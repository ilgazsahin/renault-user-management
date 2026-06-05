import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { User } from './users/entities/user.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { UsersService } from './users/users.service';
import { Role } from './common/enums/role.enum';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const password = configService.get<string>('DB_PASSWORD');
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: password || undefined,
          database: configService.get<string>('DB_DATABASE', 'usermgmt'),
          entities: [User, AuditLog],
          synchronize: true,
          retryAttempts: 3,
        };
      },
    }),
    AuthModule,
    UsersModule,
    AuditModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly usersService: UsersService) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.usersService.count();
    if (count === 0) {
      await this.usersService.create({
        username: 'admin',
        password: 'admin123',
        fullName: 'System Administrator',
        email: 'admin@example.com',
        role: Role.Admin,
      }, false);
      console.log('Seed: default admin user created');
    }
  }
}
