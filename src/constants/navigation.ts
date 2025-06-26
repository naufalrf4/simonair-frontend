import { UserRole } from '@/features/authentication/context/AuthContext';
import { NavigationGroup } from '@/types/navigation';
import {
  Home,
  Users,
  Bell,
  Wrench,
} from 'lucide-react';

export const roleConfigs: Record<UserRole, { title: string }> = {
  admin: { title: 'Administrator' },
  user: { title: 'User' },
};

export const defaultNavigation: NavigationGroup[] = [
  {
    items: [
      {
        title: 'Beranda',
        path: '/dashboard',
        icon: Home,
        roles: ['admin', 'user'],
        exact: true,
      },
      // {
      //   title: 'Alat',
      //   path: '/devices',
      //   icon: Wrench,
      //   roles: ['admin', 'user'],
      //   exact: true,
      // },
      // {
      //   title: 'Notifikasi',
      //   path: '/notifications',
      //   icon: Bell,
      //   roles: ['admin', 'user'],
      //   exact: true,
      // },
      // {
      //   title: 'Profil',
      //   path: '/profiles',
      //   icon: Users,
      //   roles: ['admin', 'user'],
      //   exact: true,
      // },
    ],
  },
];
