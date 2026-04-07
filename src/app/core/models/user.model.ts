export type UserRole = 'superAdmin' | 'cashier';
export type UserStatus = 'active' | 'inactive';

export interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  store?: string;
}
