import {
  EMPLOYMENT_TYPES,
  LEAVE_REQUEST_STATUSES,
  LEAVE_TYPES,
  TIME_ENTRY_STATUSES,
  USER_ROLE_LABELS,
} from '../domain/index.js';
import {
  employeeRepository,
  leaveRequestRepository,
  timeEntryRepository,
  userRepository,
} from '../repositories/index.js';
import { calculateWorkedMinutes } from './timeEntryManagementService.js';
import { getEmployeeDirectory } from './employeeService.js';

const EMPLOYMENT_TYPE_LABELS = Object.freeze({
  [EMPLOYMENT_TYPES.FULL_TIME]: 'Full-time',
  [EMPLOYMENT_TYPES.PART_TIME]: 'Part-time',
  [EMPLOYMENT_TYPES.CONTRACTOR]: 'Contractor',
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

const LEAVE_TYPE_LABELS = Object.freeze({
  [LEAVE_TYPES.ANNUAL]: 'Annual leave',
  [LEAVE_TYPES.SICK]: 'Sick leave',
  [LEAVE_TYPES.OTHER]: 'Other leave',
});

function parseDate(date) {
  return new Date(`${date}T12:00:00`);
}

function formatDate(date) {
  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'long',
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

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function getTimeRecords(companyId, employeeId) {
  return timeEntryRepository
    .getAllByCompany(companyId)
    .filter((entry) => entry.employeeId === employeeId)
    .sort((first, second) => second.date.localeCompare(first.date))
    .map((entry) => ({
      ...entry,
      dateLabel: formatDate(entry.date),
      timeRange:
        entry.startTime && entry.endTime
          ? `${entry.startTime} – ${entry.endTime}`
          : 'Not logged',
      totalLabel: formatMinutes(
        calculateWorkedMinutes(entry.startTime, entry.endTime),
      ),
      statusLabel:
        entry.status === TIME_ENTRY_STATUSES.COMPLETE
          ? 'Complete'
          : 'Not logged',
      statusTone:
        entry.status === TIME_ENTRY_STATUSES.COMPLETE ? 'success' : 'warning',
    }));
}

function getLeaveHistory(companyId, employeeId) {
  return leaveRequestRepository
    .getAllByCompany(companyId)
    .filter((request) => request.employeeId === employeeId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map((request) => {
      const status =
        LEAVE_STATUS_DETAILS[request.status] ??
        LEAVE_STATUS_DETAILS[LEAVE_REQUEST_STATUSES.WITHDRAWN];

      return {
        ...request,
        typeLabel: LEAVE_TYPE_LABELS[request.type] ?? 'Other leave',
        dateRangeLabel: formatDateRange(request.startDate, request.endDate),
        submittedLabel: formatDate(request.createdAt),
        statusLabel: status.label,
        statusTone: status.tone,
      };
    });
}

function getLeaveBalance(employee, leaveHistory) {
  const currentYear = String(new Date().getFullYear());
  const annualAllowance = employee.annualLeaveAllowance;
  const usedDays = leaveHistory
    .filter(
      (request) =>
        request.type === LEAVE_TYPES.ANNUAL &&
        request.status === LEAVE_REQUEST_STATUSES.APPROVED &&
        request.startDate.startsWith(currentYear),
    )
    .reduce((total, request) => total + request.workingDays, 0);
  const pendingDays = leaveHistory
    .filter(
      (request) =>
        request.type === LEAVE_TYPES.ANNUAL &&
        request.status === LEAVE_REQUEST_STATUSES.PENDING &&
        request.startDate.startsWith(currentYear),
    )
    .reduce((total, request) => total + request.workingDays, 0);
  const remainingDays = Math.max(annualAllowance - usedDays, 0);
  const nextApprovedLeave = leaveHistory
    .filter(
      (request) =>
        request.status === LEAVE_REQUEST_STATUSES.APPROVED &&
        request.endDate >= new Date().toISOString().slice(0, 10),
    )
    .sort((first, second) =>
      first.startDate.localeCompare(second.startDate),
    )[0];

  return {
    annualAllowance,
    usedDays,
    pendingDays,
    remainingDays,
    usedPercentage: annualAllowance
      ? Math.min(Math.round((usedDays / annualAllowance) * 100), 100)
      : 0,
    nextApprovedLeave: nextApprovedLeave
      ? `${nextApprovedLeave.typeLabel} · ${nextApprovedLeave.dateRangeLabel}`
      : 'No approved leave scheduled.',
  };
}

function getRecentActivity(timeRecords, leaveHistory) {
  const timeActivities = timeRecords.map((entry) => ({
    id: `activity-${entry.id}`,
    type: 'time',
    title:
      entry.status === TIME_ENTRY_STATUSES.COMPLETE
        ? 'Time entry recorded'
        : 'Time entry missing',
    description: `${entry.dateLabel} · ${entry.totalLabel}`,
    timestamp: `${entry.date}T17:00:00.000Z`,
    statusLabel: entry.statusLabel,
    statusTone: entry.statusTone,
  }));

  const leaveActivities = leaveHistory.map((request) => ({
    id: `activity-${request.id}`,
    type: 'leave',
    title: `${request.typeLabel} request`,
    description: `${request.dateRangeLabel} · ${request.workingDays} days`,
    timestamp: request.decidedAt ?? request.createdAt,
    statusLabel: request.statusLabel,
    statusTone: request.statusTone,
  }));

  return [...timeActivities, ...leaveActivities]
    .sort((first, second) => second.timestamp.localeCompare(first.timestamp))
    .slice(0, 5);
}

export function getEmployeeProfile(companyId, employeeId) {
  if (!companyId || !employeeId) {
    return null;
  }

  const directory = getEmployeeDirectory(companyId);
  const employee = directory.find((item) => item.id === employeeId);

  if (!employee) {
    return null;
  }

  const companyUsers = userRepository.getAllByCompany(companyId);
  const user = companyUsers.find((item) => item.id === employee.userId);
  const directReports = employeeRepository
    .getAllByCompany(companyId)
    .filter((item) => item.managerId === employee.id)
    .map((item) => ({
      id: item.id,
      fullName: `${item.firstName} ${item.lastName}`,
      jobTitle: item.jobTitle,
    }))
    .sort((first, second) => first.fullName.localeCompare(second.fullName));
  const timeRecords = getTimeRecords(companyId, employeeId);
  const leaveHistory = getLeaveHistory(companyId, employeeId);

  return {
    employee: {
      ...employee,
      startDateLabel: formatDate(employee.startDate),
      employmentTypeLabel:
        EMPLOYMENT_TYPE_LABELS[employee.employmentType] ??
        employee.employmentType,
    },
    organization: {
      teamName: employee.teamName,
      managerName: employee.managerName,
      roleLabel: USER_ROLE_LABELS[user?.role] ?? 'No system account',
      directReports,
    },
    leaveBalance: getLeaveBalance(employee, leaveHistory),
    recentActivity: getRecentActivity(timeRecords, leaveHistory),
    timeRecords,
    leaveHistory,
  };
}
