import {
  EMPLOYMENT_STATUSES,
  LEAVE_REQUEST_STATUSES,
  TIME_ENTRY_STATUSES,
} from '../domain/index.js';
import {
  employeeRepository,
  leaveRequestRepository,
  teamRepository,
  timeEntryRepository,
} from '../repositories/index.js';
import { calculateWorkedMinutes } from './timeEntryManagementService.js';
import { getWeekStart } from './timeTrackingService.js';

const DAY_IN_MILLISECONDS = 86_400_000;
const WORKDAYS_PER_WEEK = 5;
const STANDARD_WEEK_MINUTES = 40 * 60;

function parseDate(date) {
  return new Date(`${date}T12:00:00`);
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function getManagedTeamData(companyId, managerId) {
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

  return { teams, employees };
}

function getAvailability(employee, leaveRequests, today) {
  if (employee.status === EMPLOYMENT_STATUSES.INACTIVE) {
    return { label: 'Unavailable', tone: 'neutral', isAvailable: false };
  }

  const isOnLeave =
    employee.status === EMPLOYMENT_STATUSES.ON_LEAVE ||
    leaveRequests.some(
      (request) =>
        request.employeeId === employee.id &&
        request.status === LEAVE_REQUEST_STATUSES.APPROVED &&
        request.startDate <= today &&
        request.endDate >= today,
    );

  return isOnLeave
    ? { label: 'On leave', tone: 'warning', isAvailable: false }
    : { label: 'Available', tone: 'success', isAvailable: true };
}

function getWeekLabel(weekStart) {
  const startDate = parseDate(weekStart);
  const endDate = new Date(
    startDate.getTime() + (WORKDAYS_PER_WEEK - 1) * DAY_IN_MILLISECONDS,
  );
  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(startDate)} – ${formatter.format(
    endDate,
  )}, ${endDate.getFullYear()}`;
}

export function getDefaultManagerTeamWeekStart(companyId, managerId) {
  const { employees } = getManagedTeamData(companyId, managerId);
  const employeeIds = new Set(employees.map((employee) => employee.id));
  const latestEntry = timeEntryRepository
    .getAllByCompany(companyId)
    .filter((entry) => employeeIds.has(entry.employeeId))
    .sort((first, second) => second.date.localeCompare(first.date))[0];

  return getWeekStart(latestEntry?.date);
}

export function getManagerTeamOverview(
  companyId,
  managerId,
  weekStart,
  today = getToday(),
) {
  const manager = employeeRepository.getById(managerId);

  if (!manager || manager.companyId !== companyId) {
    return null;
  }

  const { teams, employees } = getManagedTeamData(companyId, managerId);
  const normalizedWeekStart = getWeekStart(weekStart || undefined);
  const weekEnd = toDateString(
    new Date(
      parseDate(normalizedWeekStart).getTime() +
        (WORKDAYS_PER_WEEK - 1) * DAY_IN_MILLISECONDS,
    ),
  );
  const employeeIds = new Set(employees.map((employee) => employee.id));
  const leaveRequests = leaveRequestRepository
    .getAllByCompany(companyId)
    .filter((request) => employeeIds.has(request.employeeId));
  const timeEntries = timeEntryRepository
    .getAllByCompany(companyId)
    .filter(
      (entry) =>
        employeeIds.has(entry.employeeId) &&
        entry.status === TIME_ENTRY_STATUSES.COMPLETE &&
        entry.date >= normalizedWeekStart &&
        entry.date <= weekEnd,
    );
  const members = employees
    .map((employee) => {
      const availability = getAvailability(employee, leaveRequests, today);
      const totalMinutes = timeEntries
        .filter((entry) => entry.employeeId === employee.id)
        .reduce(
          (total, entry) =>
            total + calculateWorkedMinutes(entry.startTime, entry.endTime),
          0,
        );

      return {
        id: employee.id,
        fullName: `${employee.firstName} ${employee.lastName}`,
        jobTitle: employee.jobTitle,
        location: employee.location,
        availabilityLabel: availability.label,
        availabilityTone: availability.tone,
        isAvailable: availability.isAvailable,
        totalMinutes,
        totalLabel: formatMinutes(totalMinutes),
        timePercentage: Math.min(
          Math.round((totalMinutes / STANDARD_WEEK_MINUTES) * 100),
          100,
        ),
      };
    })
    .sort((first, second) => first.fullName.localeCompare(second.fullName));
  const availableMembers = members.filter((member) => member.isAvailable);
  const pendingRequests = leaveRequests.filter(
    (request) => request.status === LEAVE_REQUEST_STATUSES.PENDING,
  );

  return {
    manager: {
      id: manager.id,
      fullName: `${manager.firstName} ${manager.lastName}`,
    },
    team: {
      names: teams.map((team) => team.name),
      name: teams.map((team) => team.name).join(', ') || 'Managed team',
    },
    weekStart: normalizedWeekStart,
    weekEnd,
    weekLabel: getWeekLabel(normalizedWeekStart),
    summary: {
      totalMembers: members.length,
      availableToday: availableMembers.length,
      onLeave: members.filter(
        (member) => member.availabilityLabel === 'On leave',
      ).length,
      pendingRequests: pendingRequests.length,
    },
    members,
  };
}
