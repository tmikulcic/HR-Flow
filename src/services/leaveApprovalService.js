import {
  LEAVE_REQUEST_STATUSES,
  LEAVE_TYPES,
  NOTIFICATION_TYPES,
} from '../domain/index.js';
import {
  employeeRepository,
  leaveRequestRepository,
  teamRepository,
} from '../repositories/index.js';
import {
  createNotification,
  notificationDataVersion,
} from './notificationService.js';

const DECISION_DETAILS = Object.freeze({
  [LEAVE_REQUEST_STATUSES.APPROVED]: {
    label: 'Approved',
    tone: 'success',
  },
  [LEAVE_REQUEST_STATUSES.DECLINED]: {
    label: 'Declined',
    tone: 'danger',
  },
});

const LEAVE_TYPE_LABELS = Object.freeze({
  [LEAVE_TYPES.ANNUAL]: 'Annual leave',
  [LEAVE_TYPES.SICK]: 'Sick leave',
  [LEAVE_TYPES.OTHER]: 'Other leave',
});

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

function getManagerScope(companyId, managerId) {
  const manager = employeeRepository.getById(managerId);

  if (!manager || manager.companyId !== companyId) {
    return null;
  }

  const teams = teamRepository
    .getAllByCompany(companyId)
    .filter((team) => team.managerId === managerId);
  const teamIds = new Set(teams.map((team) => team.id));
  const employees = employeeRepository
    .getAllByCompany(companyId)
    .filter(
      (employee) =>
        employee.managerId === managerId && teamIds.has(employee.teamId),
    );

  return {
    manager,
    teams,
    employees,
    employeeIds: new Set(employees.map((employee) => employee.id)),
  };
}

function getRequestView(request, employeesById) {
  const employee = employeesById.get(request.employeeId);
  const decision = DECISION_DETAILS[request.status];

  return {
    ...request,
    employeeName: employee
      ? `${employee.firstName} ${employee.lastName}`
      : 'Unknown employee',
    employeeJobTitle: employee?.jobTitle ?? 'Employee',
    typeLabel: LEAVE_TYPE_LABELS[request.type] ?? 'Other leave',
    dateRangeLabel: formatDateRange(request.startDate, request.endDate),
    durationLabel: `${request.workingDays} ${
      request.workingDays === 1 ? 'day' : 'days'
    }`,
    submittedLabel: formatDate(request.createdAt),
    decidedLabel: request.decidedAt ? formatDate(request.decidedAt) : '—',
    statusLabel: decision?.label ?? 'Pending',
    statusTone: decision?.tone ?? 'warning',
  };
}

function getCoverage(request, scope, approvedRequests) {
  if (!request) {
    return null;
  }

  const alreadyAway = scope.employees.filter((employee) =>
    approvedRequests.some(
      (approvedRequest) =>
        approvedRequest.employeeId === employee.id &&
        approvedRequest.id !== request.id &&
        approvedRequest.startDate <= request.endDate &&
        approvedRequest.endDate >= request.startDate,
    ),
  );
  const unavailableIds = new Set([
    request.employeeId,
    ...alreadyAway.map((employee) => employee.id),
  ]);
  const availableMembers = Math.max(
    scope.employees.length - unavailableIds.size,
    0,
  );

  return {
    requestId: request.id,
    employeeName: request.employeeName,
    dateRangeLabel: request.dateRangeLabel,
    totalMembers: scope.employees.length,
    availableMembers,
    availabilityPercentage: scope.employees.length
      ? Math.round((availableMembers / scope.employees.length) * 100)
      : 0,
    alreadyAway: alreadyAway.map(
      (employee) => `${employee.firstName} ${employee.lastName}`,
    ),
  };
}

export function getLeaveApprovalData(
  companyId,
  managerId,
  selectedRequestId = '',
) {
  const scope = getManagerScope(companyId, managerId);

  if (!scope) {
    return null;
  }

  const employeesById = new Map(
    scope.employees.map((employee) => [employee.id, employee]),
  );
  const requests = leaveRequestRepository
    .getAllByCompany(companyId)
    .filter(
      (request) =>
        request.managerId === managerId &&
        scope.employeeIds.has(request.employeeId),
    );
  const pendingRequests = requests
    .filter((request) => request.status === LEAVE_REQUEST_STATUSES.PENDING)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map((request) => getRequestView(request, employeesById));
  const decisionHistory = requests
    .filter((request) => DECISION_DETAILS[request.status])
    .sort((first, second) =>
      (second.decidedAt ?? '').localeCompare(first.decidedAt ?? ''),
    )
    .map((request) => getRequestView(request, employeesById));
  const selectedRequest =
    pendingRequests.find((request) => request.id === selectedRequestId) ??
    pendingRequests[0] ??
    null;
  const approvedRequests = requests.filter(
    (request) => request.status === LEAVE_REQUEST_STATUSES.APPROVED,
  );

  return {
    manager: {
      id: scope.manager.id,
      fullName: `${scope.manager.firstName} ${scope.manager.lastName}`,
    },
    team: {
      name: scope.teams.map((team) => team.name).join(', ') || 'Managed team',
      totalMembers: scope.employees.length,
    },
    pendingRequests,
    decisionHistory,
    coverage: getCoverage(selectedRequest, scope, approvedRequests),
  };
}

export function getPendingApprovalCount(companyId, managerId) {
  void notificationDataVersion.value;

  return (
    getLeaveApprovalData(companyId, managerId)?.pendingRequests.length ?? 0
  );
}

function validateAnnualBalance(companyId, request, employee) {
  if (request.type !== LEAVE_TYPES.ANNUAL) {
    return '';
  }

  const requestYear = request.startDate.slice(0, 4);
  const usedDays = leaveRequestRepository
    .getAllByCompany(companyId)
    .filter(
      (item) =>
        item.id !== request.id &&
        item.employeeId === request.employeeId &&
        item.type === LEAVE_TYPES.ANNUAL &&
        item.status === LEAVE_REQUEST_STATUSES.APPROVED &&
        item.startDate.startsWith(requestYear),
    )
    .reduce((total, item) => total + item.workingDays, 0);

  if (usedDays + request.workingDays > employee.annualLeaveAllowance) {
    return 'The employee does not have enough annual leave available.';
  }

  return '';
}

export function decideLeaveRequest(
  companyId,
  managerId,
  requestId,
  decision,
  managerComment = '',
) {
  if (!DECISION_DETAILS[decision]) {
    return {
      success: false,
      error: 'Select a valid decision.',
      request: null,
      notification: null,
    };
  }

  const scope = getManagerScope(companyId, managerId);
  const request = leaveRequestRepository.getById(requestId);

  if (
    !scope ||
    !request ||
    request.companyId !== companyId ||
    request.managerId !== managerId ||
    !scope.employeeIds.has(request.employeeId)
  ) {
    return {
      success: false,
      error: 'Leave request could not be found.',
      request: null,
      notification: null,
    };
  }

  if (request.status !== LEAVE_REQUEST_STATUSES.PENDING) {
    return {
      success: false,
      error: 'This leave request has already been processed.',
      request: null,
      notification: null,
    };
  }

  const employee = employeeRepository.getById(request.employeeId);
  const balanceError =
    decision === LEAVE_REQUEST_STATUSES.APPROVED
      ? validateAnnualBalance(companyId, request, employee)
      : '';

  if (balanceError) {
    return {
      success: false,
      error: balanceError,
      request: null,
      notification: null,
    };
  }

  const decidedAt = new Date().toISOString();
  const updatedRequest = leaveRequestRepository.update(requestId, {
    status: decision,
    managerId,
    managerComment: String(managerComment ?? '').trim() || null,
    decidedAt,
  });
  const decisionLabel = DECISION_DETAILS[decision].label.toLowerCase();
  const typeLabel = LEAVE_TYPE_LABELS[request.type] ?? 'Other leave';
  const notification = employee.userId
    ? createNotification({
        companyId,
        userId: employee.userId,
        type: NOTIFICATION_TYPES.LEAVE_DECISION,
        title: `Leave request ${decisionLabel}`,
        message: `Your ${typeLabel.toLowerCase()} request for ${formatDateRange(
          request.startDate,
          request.endDate,
        )} was ${decisionLabel}.`,
        relatedEntityType: 'leaveRequest',
        relatedEntityId: request.id,
        isRead: false,
        createdAt: decidedAt,
      })
    : null;

  return {
    success: true,
    error: '',
    request: updatedRequest,
    notification,
  };
}
