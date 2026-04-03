import { UserRole } from '../models/user.model';

export const ROLES: Record<string, UserRole> = {
  SUPER_ADMIN: 'superAdmin',
  CASHIER: 'cashier',
} as const;

export const MOCK_USERS = [
  {
    id: '1',
    name: 'Sarah J.',
    email: 'sarah@pos.com',
    role: 'superAdmin' as UserRole,
    avatar: 'https://i.pravatar.cc/40?u=sarah',
    store: 'Delect',
  },
  {
    id: '2',
    name: 'John D.',
    email: 'john@pos.com',
    role: 'cashier' as UserRole,
    avatar: 'https://i.pravatar.cc/40?u=johnd',
    store: 'Delect',
  },
];
