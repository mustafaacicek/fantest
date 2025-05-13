export interface AdminUser {
  id?: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  teamId: number;
  teamName?: string;
  password?: string; // Only used for create/update requests
}
