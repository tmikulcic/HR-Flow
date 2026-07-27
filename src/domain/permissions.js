import { USER_ROLES } from './constants.js';

export const PERMISSIONS = Object.freeze({
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_EMPLOYEES: 'view_employees',
  VIEW_EMPLOYEE_DETAILS: 'view_employee_details',
  TRACK_TIME: 'track_time',
  MANAGE_OWN_LEAVE: 'manage_own_leave',
  VIEW_TEAM: 'view_team',
  REVIEW_LEAVE_REQUESTS: 'review_leave_requests',
  VIEW_NOTIFICATIONS: 'view_notifications',
  MANAGE_ADMINISTRATION: 'manage_administration',
});

const COMMON_PERMISSIONS = [
  PERMISSIONS.VIEW_DASHBOARD,
  PERMISSIONS.VIEW_EMPLOYEE_DETAILS,
  PERMISSIONS.TRACK_TIME,
  PERMISSIONS.MANAGE_OWN_LEAVE,
  PERMISSIONS.VIEW_NOTIFICATIONS,
];

export const ROLE_PERMISSIONS = Object.freeze({
  [USER_ROLES.ADMINISTRATOR]: [
    ...COMMON_PERMISSIONS,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.MANAGE_ADMINISTRATION,
  ],
  [USER_ROLES.HR]: [...COMMON_PERMISSIONS, PERMISSIONS.VIEW_EMPLOYEES],
  [USER_ROLES.MANAGER]: [
    ...COMMON_PERMISSIONS,
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.REVIEW_LEAVE_REQUESTS,
  ],
  [USER_ROLES.EMPLOYEE]: [...COMMON_PERMISSIONS],
});

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessEmployee(user, currentEmployee, targetEmployee) {
  if (!user || !targetEmployee || user.companyId !== targetEmployee.companyId) {
    return false;
  }

  if (user.role === USER_ROLES.ADMINISTRATOR || user.role === USER_ROLES.HR) {
    return true;
  }

  if (!currentEmployee) {
    return false;
  }

  if (user.role === USER_ROLES.MANAGER) {
    return (
      targetEmployee.id === currentEmployee.id ||
      targetEmployee.managerId === currentEmployee.id
    );
  }

  return targetEmployee.id === currentEmployee.id;
}
