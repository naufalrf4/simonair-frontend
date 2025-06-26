import { defaultNavigation } from '@/constants/navigation';
import { UserRole } from '@/features/users/types';
import { NavigationGroup } from '@/types/navigation';

export const filterNavigationByRole = (userRole?: UserRole): NavigationGroup[] => {
  if (!userRole) return [];

  if (userRole.toLowerCase() === 'superadmin') return defaultNavigation;

  return defaultNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const canAccessParent =
          !item.roles ||
          item.roles.length === 0 ||
          item.roles.some((role) => role.toLowerCase() === userRole.toLowerCase());

        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter(
            (child) =>
              !child.roles ||
              child.roles.length === 0 ||
              child.roles.some((role) => role.toLowerCase() === userRole.toLowerCase()),
          );

          if (filteredChildren.length > 0) {
            item.children = filteredChildren;
            return true;
          }
        }

        return canAccessParent;
      }),
    }))
    .filter((group) => group.items.length > 0);
};

/**
 * Checks if a user has access to a specific path based on their role
 * @param path - The path to check
 * @param userRole - The user's role
 * @returns Whether the user has access to the path
 */
export const hasPathAccess = (path: string, userRole?: UserRole): boolean => {
  if (!userRole) return false;
  if (userRole.toLowerCase() === 'superadmin') return true;

  let hasAccess = false;

  defaultNavigation.forEach((group) => {
    group.items.forEach((item) => {
      if (item.path === path) {
        hasAccess =
          !item.roles ||
          item.roles.length === 0 ||
          item.roles.some((role) => role.toLowerCase() === userRole.toLowerCase());
      }

      if (item.children) {
        item.children.forEach((child) => {
          if (child.path === path) {
            hasAccess =
              !child.roles ||
              child.roles.length === 0 ||
              child.roles.some((role) => role.toLowerCase() === userRole.toLowerCase());
          }
        });
      }
    });
  });

  return hasAccess;
};
