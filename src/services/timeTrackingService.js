import { TIME_ENTRY_STATUSES, USER_ROLES } from '../domain/index.js';
import {
  employeeRepository,
  teamRepository,
  timeEntryRepository,
} from '../repositories/index.js';

const DAY_IN_MILLISECONDS = 86_400_000;

function parseDate(date) {
  return new Date(`${date}T12:00:00`);
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function canReviewCompanyTime(user) {
  return (
    user?.role === USER_ROLES.ADMINISTRATOR || user?.role === USER_ROLES.HR
  );
}

export function getTimeTrackingEmployeeOptions(
  companyId,
  user,
  currentEmployee,
) {
  if (!companyId || !user) {
    return [];
  }

  const employees = employeeRepository.getAllByCompany(companyId);
  const teams = new Map(
    teamRepository
      .getAllByCompany(companyId)
      .map((team) => [team.id, team.name]),
  );
  const visibleEmployees = canReviewCompanyTime(user)
    ? employees
    : employees.filter((employee) => employee.id === currentEmployee?.id);

  return visibleEmployees
    .map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
      jobTitle: employee.jobTitle,
      teamName: teams.get(employee.teamId) ?? 'Not assigned',
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function getWeekStart(date = toDateString(new Date())) {
  const parsedDate = parseDate(date);
  const dayOffset = (parsedDate.getDay() + 6) % 7;

  return toDateString(
    new Date(parsedDate.getTime() - dayOffset * DAY_IN_MILLISECONDS),
  );
}

export function shiftWeek(weekStart, offset) {
  const date = parseDate(weekStart);

  return toDateString(
    new Date(date.getTime() + offset * 7 * DAY_IN_MILLISECONDS),
  );
}

export function getDefaultWeekStart(companyId, employeeId) {
  const latestEntry = timeEntryRepository
    .getAllByCompany(companyId)
    .filter((entry) => entry.employeeId === employeeId)
    .sort((first, second) => second.date.localeCompare(first.date))[0];

  return getWeekStart(latestEntry?.date);
}

export function getWeeklyTimeRecords(companyId, employeeId, weekStart) {
  const employee = employeeRepository
    .getAllByCompany(companyId)
    .find((item) => item.id === employeeId);

  if (!employee) {
    return null;
  }

  const entries = timeEntryRepository
    .getAllByCompany(companyId)
    .filter((entry) => entry.employeeId === employeeId);
  const startDate = parseDate(getWeekStart(weekStart));
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(startDate.getTime() + index * DAY_IN_MILLISECONDS);
    const dateId = toDateString(date);
    const entry = entries.find((item) => item.date === dateId);
    const isComplete = entry?.status === TIME_ENTRY_STATUSES.COMPLETE;

    return {
      date: dateId,
      dateLabel: new Intl.DateTimeFormat('en', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(date),
      entryId: entry?.id ?? null,
      startTime: isComplete ? entry.startTime : '—',
      endTime: isComplete ? entry.endTime : '—',
      breakLabel:
        isComplete && entry.breakMinutes ? `${entry.breakMinutes} min` : '—',
      totalLabel: isComplete ? formatMinutes(entry.totalMinutes) : '—',
      status: isComplete ? 'complete' : 'missing',
      statusLabel: isComplete ? 'Complete' : 'Not logged',
      statusTone: isComplete ? 'success' : 'warning',
    };
  });
  const endDate = new Date(startDate.getTime() + 4 * DAY_IN_MILLISECONDS);
  const weekFormatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  });

  return {
    employee: {
      id: employee.id,
      fullName: `${employee.firstName} ${employee.lastName}`,
      jobTitle: employee.jobTitle,
    },
    weekStart: toDateString(startDate),
    weekEnd: toDateString(endDate),
    weekLabel: `${weekFormatter.format(startDate)} – ${weekFormatter.format(
      endDate,
    )}, ${endDate.getFullYear()}`,
    days,
  };
}
