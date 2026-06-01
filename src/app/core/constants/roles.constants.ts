import { UserRole } from '../models/user.model';

/** Mock credentials used for demo authentication. */
export const MOCK_CREDENTIALS = {
  superAdmin: 'eric@123',
  cashier: '12345',
} as const;

export const ROLES: Record<string, UserRole> = {
  SUPER_ADMIN: 'superAdmin',
  CASHIER: 'cashier',
} as const;

export const MOCK_USERS: Array<{
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatar: string;
  store: string;
}> = [
  {
    id: '1',
    name: 'Sarah J.',
    email: 'sarah@pos.com',
    role: 'superAdmin',
    status: 'active',
    avatar: 'https://i.pravatar.cc/40?u=sarah',
    store: 'Delect',
  },
  {
    id: '2',
    name: 'John D.',
    email: 'john@pos.com',
    role: 'cashier',
    status: 'inactive',
    avatar: 'https://i.pravatar.cc/40?u=johnd',
    store: 'Delect',
  },
  {
    id: '3',
    name: 'Emma R.',
    email: 'emma@pos.com',
    role: 'cashier',
    status: 'inactive',
    avatar: 'https://i.pravatar.cc/40?u=emmar',
    store: 'Delect',
  },
  {
    id: '4',
    name: 'Mike T.',
    email: 'mike@pos.com',
    role: 'cashier',
    status: 'inactive',
    avatar: 'https://i.pravatar.cc/40?u=miket',
    store: 'Delect',
  },
  {
    id: '5',
    name: 'Lisa K.',
    email: 'lisa@pos.com',
    role: 'superAdmin',
    status: 'active',
    avatar: 'https://i.pravatar.cc/40?u=lisak',
    store: 'Delect',
  },
  {
    id: '6',
    name: 'Eric A.',
    email: 'eric@user.com',
    role: 'superAdmin',
    status: 'active',
    avatar: 'https://i.pravatar.cc/40?u=erica',
    store: 'Delect',
  },
  {
    id: '7',
    name: 'Esther U.',
    email: 'esther@user.com',
    password: 'esther@123',
    role: 'superAdmin',
    status: 'active',
    avatar: 'https://i.pravatar.cc/40?u=esther',
    store: 'Delect',
  },
];
