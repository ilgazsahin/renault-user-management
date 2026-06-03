import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsIn(['fullName', 'username', 'createdAt'])
  sortBy?: 'fullName' | 'username' | 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
