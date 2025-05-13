import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser } from '../models/admin-user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private apiUrl = `${environment.apiUrl}/api/superadmin/users`;

  constructor(private http: HttpClient) { }

  // Get all admin users
  getAllAdmins(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  // Get admin user by ID
  getAdminById(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/${id}`);
  }

  // Get admin users by team
  getAdminsByTeam(teamId: number): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/team/${teamId}`);
  }

  // Create a new admin user
  createAdmin(admin: AdminUser): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, admin);
  }

  // Update an existing admin user
  updateAdmin(id: number, admin: AdminUser): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/${id}`, admin);
  }

  // Delete an admin user
  deleteAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
