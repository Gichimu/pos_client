export type UserRole = 'superAdmin' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  store?: string;
}
