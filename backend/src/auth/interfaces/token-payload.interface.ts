import { Role } from '../../common/enums/role.enum';

export interface TokenPayload {
  sub: string;
  username: string;
  role: Role;
}
