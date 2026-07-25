/**
 * Centralized domain values used across the application.
 * Keeping them here avoids repeating status and role strings in components.
 */

export const USER_ROLES = Object.freeze({
  ADMINISTRATOR: 'administrator',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
})

export const USER_ROLE_LABELS = Object.freeze({
  [USER_ROLES.ADMINISTRATOR]: 'Administrator',
  [USER_ROLES.HR]: 'HR',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.EMPLOYEE]: 'Employee',
})

export const USER_ACCESS_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INVITED: 'invited',
  DISABLED: 'disabled',
})

export const EMPLOYMENT_STATUSES = Object.freeze({
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  INACTIVE: 'inactive',
})

export const EMPLOYMENT_TYPES = Object.freeze({
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACTOR: 'contractor',
})

export const TIME_ENTRY_STATUSES = Object.freeze({
  COMPLETE: 'complete',
  MISSING: 'missing',
})

export const LEAVE_TYPES = Object.freeze({
  ANNUAL: 'annual',
  SICK: 'sick',
  OTHER: 'other',
})

export const LEAVE_REQUEST_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
})

export const NOTIFICATION_TYPES = Object.freeze({
  LEAVE_REQUEST: 'leave_request',
  LEAVE_DECISION: 'leave_decision',
  TIME_REMINDER: 'time_reminder',
  EMPLOYEE_UPDATE: 'employee_update',
  USER_INVITATION: 'user_invitation',
})

/** @typedef {(typeof USER_ROLES)[keyof typeof USER_ROLES]} UserRole */
/** @typedef {(typeof USER_ACCESS_STATUSES)[keyof typeof USER_ACCESS_STATUSES]} UserAccessStatus */
/** @typedef {(typeof EMPLOYMENT_STATUSES)[keyof typeof EMPLOYMENT_STATUSES]} EmploymentStatus */
/** @typedef {(typeof EMPLOYMENT_TYPES)[keyof typeof EMPLOYMENT_TYPES]} EmploymentType */
/** @typedef {(typeof TIME_ENTRY_STATUSES)[keyof typeof TIME_ENTRY_STATUSES]} TimeEntryStatus */
/** @typedef {(typeof LEAVE_TYPES)[keyof typeof LEAVE_TYPES]} LeaveType */
/** @typedef {(typeof LEAVE_REQUEST_STATUSES)[keyof typeof LEAVE_REQUEST_STATUSES]} LeaveRequestStatus */
/** @typedef {(typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]} NotificationType */
