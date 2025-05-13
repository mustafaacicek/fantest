import { Role } from './role.enum';

export interface User {
  username: string;
  role: Role;
  userId: number;
  token: string;
  refreshToken: string;
}
