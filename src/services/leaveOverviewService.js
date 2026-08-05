import { LEAVE_REQUEST_STATUSES, LEAVE_TYPES } from '../domain/index.js';
import {
  employeeRepository,
  leaveRequestRepository,
} from '../repositories/index.js';

const LEAVE_TYPE_LABELS = Object.freeze({
  [LEAVE_TYPES.ANNUAL]: 'Annual leave',
  [LEAVE_TYPES.SICK]: 'Sick leave',
  [LEAVE_TYPES.OTHER]: 'Other leave',
});

const LEAVE_STATUS_DETAILS = Object.freeze({
  [LEAVE_REQUEST_STATUSES.PENDING]: {
    label: 'Pending',
    tone: 'warning',
  },
  [LEAVE_REQUEST_STATUSES.APPROVED]: {
    label: 'Approved',
    tone: 'success',
  },
  [LEAVE_REQUEST_STATUSES.DECLINED]: {
    label: 'Declined',
    tone: 'danger',
  },
  [LEAVE_REQUEST_STATUSES.WITHDRAWN]: {
    label: 'Withdrawn',
    tone: 'neutral',
  },
});

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(date) {
  return new Date(`${date}T12:00:00`);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date.includes('T') ? new Date(date) : parseDate(date));
}

function formatDateRange(startDate, endDate) {
  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${formatter.format(parseDate(startDate))} – ${formatter.format(
    parseDate(endDate),
  )}`;
}

function getRequestView(request) {
  const status =
    LEAVE_STATUS_DETAILS[request.status] ??
    LEAVE_STATUS_DETAILS[LEAVE_REQUEST_STATUSES.WITHDRAWN];

  return {
    ...request,
    typeLabel: LEAVE_TYPE_LABELS[request.type] ?? 'Other leave',
    dateRangeLabel: formatDateRange(request.startDate, request.endDate),
    submittedLabel: formatDate(request.createdAt),
    decidedLabel: request.decidedAt ? formatDate(request.decidedAt) : '—',
    durationLabel: `${request.workingDays} ${
      request.workingDays === 1 ? 'day' : 'days'
    }`,
    statusLabel: status.label,
    statusTone: status.tone,
  };
}

export function getEmployeeLeaveOverview(
  companyId,
  employeeId,
  today = getToday(),
) {
  const employee = employeeRepository.getById(employeeId);

  if (!employee || employee.companyId !== companyId) {
    return null;
  }

  const requests = leaveRequestRepository
    .getAllByCompany(companyId)
    .filter((request) => request.employeeId === employeeId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map(getRequestView);
  const currentYear = today.slice(0, 4);
  const approvedAnnualRequests = requests.filter(
    (request) =>
      request.type === LEAVE_TYPES.ANNUAL &&
      request.status === LEAVE_REQUEST_STATUSES.APPROVED &&
      request.startDate.startsWith(currentYear),
  );
  const pendingAnnualRequests = requests.filter(
    (request) =>
      request.type === LEAVE_TYPES.ANNUAL &&
      request.status === LEAVE_REQUEST_STATUSES.PENDING &&
      request.startDate.startsWith(currentYear),
  );
  const usedDays = approvedAnnualRequests.reduce(
    (total, request) => total + request.workingDays,
    0,
  );
  const pendingDays = pendingAnnualRequests.reduce(
    (total, request) => total + request.workingDays,
    0,
  );
  const allowance = employee.annualLeaveAllowance;
  const remainingDays = Math.max(allowance - usedDays, 0);
  const statusCounts = Object.fromEntries(
    Object.values(LEAVE_REQUEST_STATUSES).map((status) => [
      status,
      requests.filter((request) => request.status === status).length,
    ]),
  );
  const upcomingLeave = requests
    .filter(
      (request) =>
        request.status === LEAVE_REQUEST_STATUSES.APPROVED &&
        request.endDate >= today,
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate));

  return {
    employee: {
      id: employee.id,
      fullName: `${employee.firstName} ${employee.lastName}`,
    },
    balance: {
      allowance,
      usedDays,
      pendingDays,
      remainingDays,
      usedPercentage: allowance
        ? Math.min(Math.round((usedDays / allowance) * 100), 100)
        : 0,
    },
    requests,
    statusCounts,
    upcomingLeave,
  };
}
