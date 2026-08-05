import {
  LEAVE_REQUEST_STATUSES,
  LEAVE_TYPES,
  USER_ROLES,
} from '../domain/index.js';
import {
  employeeRepository,
  leaveRequestRepository,
  userRepository,
} from '../repositories/index.js';
import { getEmployeeLeaveOverview } from './leaveOverviewService.js';

const DAY_IN_MILLISECONDS = 86_400_000;

export const LEAVE_TYPE_OPTIONS = Object.freeze([
  { value: LEAVE_TYPES.ANNUAL, label: 'Annual leave' },
  { value: LEAVE_TYPES.SICK, label: 'Sick leave' },
  { value: LEAVE_TYPES.OTHER, label: 'Other leave' },
]);

function createId() {
  return `leave-${globalThis.crypto.randomUUID()}`;
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function countWorkingDays(startDate, endDate) {
  if (!isValidDate(startDate) || !isValidDate(endDate) || endDate < startDate) {
    return 0;
  }

  const startTime = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const totalDays = Math.floor((endTime - startTime) / DAY_IN_MILLISECONDS) + 1;
  const fullWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;
  let workingDays = fullWeeks * 5;

  for (let index = 0; index < remainingDays; index += 1) {
    const day = new Date(startTime + index * DAY_IN_MILLISECONDS).getUTCDay();

    if (day !== 0 && day !== 6) {
      workingDays += 1;
    }
  }

  return workingDays;
}

function getReviewer(companyId, employee) {
  const directManager = employee.managerId
    ? employeeRepository.getById(employee.managerId)
    : null;

  if (directManager?.companyId === companyId) {
    return directManager;
  }

  const users = userRepository.getAllByCompany(companyId);
  const reviewerUser =
    users.find(
      (user) =>
        user.role === USER_ROLES.ADMINISTRATOR &&
        user.employeeId &&
        user.employeeId !== employee.id,
    ) ??
    users.find(
      (user) =>
        user.role === USER_ROLES.HR &&
        user.employeeId &&
        user.employeeId !== employee.id,
    );

  return reviewerUser
    ? employeeRepository.getById(reviewerUser.employeeId)
    : null;
}

function normalizeValues(values) {
  return {
    type: String(values.type ?? '').trim(),
    startDate: String(values.startDate ?? '').trim(),
    endDate: String(values.endDate ?? '').trim(),
    reason: String(values.reason ?? '').trim(),
  };
}

function validateRequest(values) {
  const errors = {};

  if (!Object.values(LEAVE_TYPES).includes(values.type)) {
    errors.type = 'Select a valid leave type.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  } else if (!isValidDate(values.startDate)) {
    errors.startDate = 'Enter a valid start date.';
  }

  if (!values.endDate) {
    errors.endDate = 'End date is required.';
  } else if (!isValidDate(values.endDate)) {
    errors.endDate = 'Enter a valid end date.';
  } else if (
    isValidDate(values.startDate) &&
    values.endDate < values.startDate
  ) {
    errors.endDate = 'End date must be on or after start date.';
  } else if (countWorkingDays(values.startDate, values.endDate) === 0) {
    errors.endDate = 'The selected range must include a weekday.';
  }

  if (!values.reason) {
    errors.reason = 'Reason is required.';
  }

  return errors;
}

export function getLeaveRequestContext(companyId, employeeId) {
  const overview = getEmployeeLeaveOverview(companyId, employeeId);

  if (!overview) {
    return null;
  }

  const employee = employeeRepository.getById(employeeId);
  const reviewer = getReviewer(companyId, employee);

  return {
    employee: overview.employee,
    reviewer: reviewer
      ? {
          id: reviewer.id,
          fullName: `${reviewer.firstName} ${reviewer.lastName}`,
        }
      : null,
    balance: overview.balance,
  };
}

export function getLeaveRequestPreview(companyId, employeeId, formValues) {
  const context = getLeaveRequestContext(companyId, employeeId);
  const values = normalizeValues(formValues);
  const workingDays = countWorkingDays(values.startDate, values.endDate);
  const affectsAnnualBalance = values.type === LEAVE_TYPES.ANNUAL;

  if (!context) {
    return null;
  }

  return {
    workingDays,
    affectsAnnualBalance,
    currentRemainingDays: context.balance.remainingDays,
    remainingAfterApproval: affectsAnnualBalance
      ? context.balance.remainingDays - workingDays
      : context.balance.remainingDays,
  };
}

export function saveLeaveRequest(companyId, employeeId, formValues) {
  const context = getLeaveRequestContext(companyId, employeeId);

  if (!context) {
    return {
      success: false,
      errors: { form: 'Employee could not be found.' },
      request: null,
    };
  }

  if (!context.reviewer) {
    return {
      success: false,
      errors: { form: 'A reviewer could not be assigned.' },
      request: null,
    };
  }

  const values = normalizeValues(formValues);
  const errors = validateRequest(values);

  if (Object.keys(errors).length) {
    return { success: false, errors, request: null };
  }

  const request = leaveRequestRepository.add({
    id: createId(),
    companyId,
    employeeId,
    managerId: context.reviewer.id,
    type: values.type,
    startDate: values.startDate,
    endDate: values.endDate,
    workingDays: countWorkingDays(values.startDate, values.endDate),
    reason: values.reason,
    status: LEAVE_REQUEST_STATUSES.PENDING,
    managerComment: null,
    createdAt: new Date().toISOString(),
    decidedAt: null,
  });

  return { success: true, errors: {}, request };
}
