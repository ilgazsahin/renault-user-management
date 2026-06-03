import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.Admin, Role.User)
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.User)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: TokenPayload) {
    return this.usersService.create(dto, true, { id: currentUser.sub, username: currentUser.username });
  }

  @Patch('me/password')
  @Roles(Role.Admin, Role.User)
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() currentUser: TokenPayload,
  ) {
    return this.usersService.changePassword(currentUser.sub, dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: TokenPayload,
  ) {
    return this.usersService.update(id, dto, { id: currentUser.sub, username: currentUser.username });
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: TokenPayload,
  ) {
    return this.usersService.remove(id, { id: currentUser.sub, username: currentUser.username });
  }
}
