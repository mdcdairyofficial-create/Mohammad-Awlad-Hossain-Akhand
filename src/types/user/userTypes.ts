export interface UserProfile {
  id: string;
  fullName: string;
  mobile: string;
  district: string;
  country: string;
  userType: 'lawyer' | 'clerk' | 'client';
}
