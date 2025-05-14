import { Role } from './role.enum';

export interface User {
  username: string;
  role: Role;
  userId: number;
  token: string;
  accessToken: string; // Added for JWT token handling
  refreshToken: string;
  teamId?: number;
  teamName?: string;
}
