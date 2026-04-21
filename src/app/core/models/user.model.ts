export type UserRole = 'superAdmin' | 'cashier' | 'manager';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: UserRole[];
  status: UserStatus;
  avatar?: string;
  store?: string;
}
