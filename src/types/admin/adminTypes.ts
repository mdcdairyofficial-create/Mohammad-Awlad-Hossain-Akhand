export interface AdminUser {
  id: string;
  name: string;
  email: string;
  user_type: 'super_admin' | 'admin';
  created_at: string;
}
