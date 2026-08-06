import {
  LEAVE_REQUEST_STATUSES,
  LEAVE_TYPES,
  NOTIFICATION_TYPES,
  USER_ROLES,
} from '../domain/index.js';
import {
  employeeRepository,
  leaveRequestRepository,
  userRepository,
} from '../repositories/index.js';
import { getEmployeeLeaveOverview } from './leaveOverviewService.js';
import { createNotification } from './notificationService.js';

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

function validateRequest(companyId, employeeId, values, context, today) {
  const errors = {};

  if (!Object.values(LEAVE_TYPES).includes(values.type)) {
    errors.type = 'Select a valid leave type.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  } else if (!isValidDate(values.startDate)) {
    errors.startDate = 'Enter a valid start date.';
  } else if (values.startDate < today) {
    errors.startDate = 'Start date cannot be in the past.';
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

  if (!errors.startDate && !errors.endDate) {
    const overlappingRequest = leaveRequestRepository
      .getAllByCompany(companyId)
      .find(
        (request) =>
          request.employeeId === employeeId &&
          [
            LEAVE_REQUEST_STATUSES.PENDING,
            LEAVE_REQUEST_STATUSES.APPROVED,
          ].includes(request.status) &&
          values.startDate <= request.endDate &&
          values.endDate >= request.startDate,
      );

    if (overlappingRequest) {
      errors.startDate = 'These dates overlap with an existing leave request.';
    }

    const workingDays = countWorkingDays(values.startDate, values.endDate);
    const availableDays = Math.max(
      context.balance.remainingDays - context.balance.pendingDays,
      0,
    );

    if (values.type === LEAVE_TYPES.ANNUAL && workingDays > availableDays) {
      errors.endDate = `Only ${availableDays} annual leave days are available.`;
    }
  }

  return errors;
}

export function getLeaveRequestContext(companyId, employeeId, today) {
  const overview = getEmployeeLeaveOverview(companyId, employeeId, today);

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
          userId: reviewer.userId,
        }
      : null,
    balance: overview.balance,
  };
}

export function getLeaveRequestPreview(
  companyId,
  employeeId,
  formValues,
  today,
) {
  const context = getLeaveRequestContext(companyId, employeeId, today);
  const values = normalizeValues(formValues);
  const workingDays = countWorkingDays(values.startDate, values.endDate);
  const affectsAnnualBalance = values.type === LEAVE_TYPES.ANNUAL;

  if (!context) {
    return null;
  }

  const availableDays = Math.max(
    context.balance.remainingDays - context.balance.pendingDays,
    0,
  );

  return {
    workingDays,
    affectsAnnualBalance,
    currentRemainingDays: availableDays,
    remainingAfterApproval: affectsAnnualBalance
      ? availableDays - workingDays
      : availableDays,
  };
}

export function saveLeaveRequest(
  companyId,
  employeeId,
  formValues,
  today = new Date().toISOString().slice(0, 10),
) {
  const context = getLeaveRequestContext(companyId, employeeId, today);

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
  const errors = validateRequest(companyId, employeeId, values, context, today);

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
  const leaveType = LEAVE_TYPE_OPTIONS.find(
    (option) => option.value === request.type,
  );
  const notification = createNotification({
    companyId,
    userId: context.reviewer.userId,
    type: NOTIFICATION_TYPES.LEAVE_REQUEST,
    title:
      request.type === LEAVE_TYPES.SICK
        ? 'New sick leave request'
        : 'New leave request',
    message: `${context.employee.fullName} requested ${
      request.workingDays
    } ${request.workingDays === 1 ? 'day' : 'days'} of ${(
      leaveType?.label ?? 'leave'
    ).toLowerCase()}.`,
    relatedEntityType: 'leaveRequest',
    relatedEntityId: request.id,
    createdAt: request.createdAt,
  });

  return { success: true, errors: {}, request, notification };
}

export function getLeaveRequestDetails(companyId, employeeId, requestId) {
  const overview = getEmployeeLeaveOverview(companyId, employeeId);
  const request = overview?.requests.find((item) => item.id === requestId);

  if (!request) {
    return null;
  }

  const reviewer = employeeRepository.getById(request.managerId);

  return {
    ...request,
    reviewerName:
      reviewer?.companyId === companyId
        ? `${reviewer.firstName} ${reviewer.lastName}`
        : 'Not assigned',
    canWithdraw: request.status === LEAVE_REQUEST_STATUSES.PENDING,
  };
}

export function withdrawLeaveRequest(companyId, employeeId, requestId) {
  const request = leaveRequestRepository.getById(requestId);

  if (
    !request ||
    request.companyId !== companyId ||
    request.employeeId !== employeeId
  ) {
    return {
      success: false,
      error: 'Leave request could not be found.',
      request: null,
    };
  }

  if (request.status !== LEAVE_REQUEST_STATUSES.PENDING) {
    return {
      success: false,
      error: 'Only a pending request can be withdrawn.',
      request: null,
    };
  }

  const updatedRequest = leaveRequestRepository.update(requestId, {
    status: LEAVE_REQUEST_STATUSES.WITHDRAWN,
    decidedAt: new Date().toISOString(),
  });

  return { success: true, error: '', request: updatedRequest };
}
