import {
  EMPLOYMENT_STATUSES,
  LEAVE_REQUEST_STATUSES,
  LEAVE_TYPES,
  TIME_ENTRY_STATUSES,
  USER_ROLES,
} from '../domain/index.js';
import {
  employeeRepository,
  leaveRequestRepository,
  notificationRepository,
  teamRepository,
  timeEntryRepository,
  userRepository,
} from '../repositories/index.js';
import { calculateWorkedMinutes } from './timeEntryManagementService.js';

const DAY_IN_MILLISECONDS = 86_400_000;

function parseDate(date) {
  return new Date(`${date}T12:00:00`);
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatDateRange(startDate, endDate) {
  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(parseDate(startDate))}–${formatter.format(
    parseDate(endDate),
  )}`;
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function getEmployeeName(employee) {
  return employee
    ? `${employee.firstName} ${employee.lastName}`
    : 'Unknown employee';
}

function getWeekDays(referenceDate) {
  const date = parseDate(referenceDate);
  const dayOffset = (date.getDay() + 6) % 7;
  const monday = new Date(date.getTime() - dayOffset * DAY_IN_MILLISECONDS);

  return Array.from({ length: 5 }, (_, index) => {
    const currentDate = new Date(
      monday.getTime() + index * DAY_IN_MILLISECONDS,
    );

    return {
      date: toDateString(currentDate),
      day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(
        currentDate,
      ),
      dayNumber: currentDate.getDate(),
    };
  });
}

function getScopedEmployees(user, currentEmployee, employees) {
  if (user.role === USER_ROLES.ADMINISTRATOR || user.role === USER_ROLES.HR) {
    return employees;
  }

  if (user.role === USER_ROLES.MANAGER) {
    return employees.filter(
      (employee) => employee.managerId === currentEmployee?.id,
    );
  }

  return currentEmployee ? [currentEmployee] : [];
}

function isEmployeeUnavailable(employee, leaveRequests, date) {
  if (employee.status === EMPLOYMENT_STATUSES.ON_LEAVE) {
    return true;
  }

  return leaveRequests.some(
    (request) =>
      request.employeeId === employee.id &&
      request.status === LEAVE_REQUEST_STATUSES.APPROVED &&
      request.startDate <= date &&
      request.endDate >= date,
  );
}

function getWeeklyAttendance(timeEntries, weekDays) {
  const completedEntries = timeEntries.filter(
    (entry) => entry.status === TIME_ENTRY_STATUSES.COMPLETE,
  );

  const days = weekDays.map((day) => {
    const entries = completedEntries.filter((entry) => entry.date === day.date);
    const totalMinutes = entries.reduce(
      (total, entry) =>
        total + calculateWorkedMinutes(entry.startTime, entry.endTime),
      0,
    );

    return {
      ...day,
      people: new Set(entries.map((entry) => entry.employeeId)).size,
      totalMinutes,
      formattedTime: formatMinutes(totalMinutes),
    };
  });

  const maximumMinutes = Math.max(...days.map((day) => day.totalMinutes), 1);

  return days.map((day) => ({
    ...day,
    percentage: Math.round((day.totalMinutes / maximumMinutes) * 100),
  }));
}

function getTeamAvailability(scopedEmployees, teams, leaveRequests, today) {
  return teams
    .map((team) => {
      const teamEmployees = scopedEmployees.filter(
        (employee) => employee.teamId === team.id,
      );
      const unavailable = teamEmployees.filter((employee) =>
        isEmployeeUnavailable(employee, leaveRequests, today),
      ).length;
      const available = teamEmployees.length - unavailable;
      const pendingRequests = leaveRequests.filter(
        (request) =>
          request.status === LEAVE_REQUEST_STATUSES.PENDING &&
          teamEmployees.some((employee) => employee.id === request.employeeId),
      ).length;

      return {
        id: team.id,
        name: team.name,
        total: teamEmployees.length,
        available,
        pendingRequests,
        percentage: teamEmployees.length
          ? Math.round((available / teamEmployees.length) * 100)
          : 0,
      };
    })
    .filter((team) => team.total > 0);
}

function getLatestTimeActivities(timeEntries, employeesById) {
  const latestEntriesByEmployee = new Map();

  timeEntries
    .filter((entry) => entry.status === TIME_ENTRY_STATUSES.COMPLETE)
    .forEach((entry) => {
      const existingEntry = latestEntriesByEmployee.get(entry.employeeId);

      if (!existingEntry || entry.date > existingEntry.date) {
        latestEntriesByEmployee.set(entry.employeeId, entry);
      }
    });

  return [...latestEntriesByEmployee.values()].map((entry) => {
    const employee = employeesById.get(entry.employeeId);

    return {
      id: `activity-${entry.id}`,
      type: 'time',
      title: `${getEmployeeName(employee)} logged working time`,
      description: `${formatMinutes(
        calculateWorkedMinutes(entry.startTime, entry.endTime),
      )} recorded`,
      timestamp: `${entry.date}T17:00:00.000Z`,
      dateLabel: formatDate(`${entry.date}T12:00:00.000Z`),
      status: '',
    };
  });
}

function getLeaveActivities(leaveRequests, employeesById) {
  const statusLabels = {
    [LEAVE_REQUEST_STATUSES.PENDING]: 'Pending',
    [LEAVE_REQUEST_STATUSES.APPROVED]: 'Approved',
    [LEAVE_REQUEST_STATUSES.DECLINED]: 'Declined',
    [LEAVE_REQUEST_STATUSES.WITHDRAWN]: 'Withdrawn',
  };

  return leaveRequests.map((request) => {
    const employee = employeesById.get(request.employeeId);
    const leaveType =
      request.type === LEAVE_TYPES.SICK ? 'sick leave' : 'annual leave';

    return {
      id: `activity-${request.id}`,
      type: 'leave',
      title: `${getEmployeeName(employee)} submitted ${leaveType}`,
      description: `${formatDateRange(request.startDate, request.endDate)} · ${
        request.workingDays
      } working days`,
      timestamp: request.createdAt,
      dateLabel: formatDate(request.createdAt),
      status: statusLabels[request.status],
    };
  });
}

function getEmployeeActivities(users, employeesById, teamsById) {
  return users.map((user) => {
    const employee = employeesById.get(user.employeeId);
    const team = teamsById.get(employee?.teamId);

    return {
      id: `activity-${user.id}`,
      type: 'employee',
      title: `${getEmployeeName(employee)} joined the company`,
      description: team?.name ?? employee?.jobTitle ?? 'Employee record added',
      timestamp: user.createdAt,
      dateLabel: formatDate(user.createdAt),
      status: '',
    };
  });
}

function getRecentActivity(
  user,
  scopedEmployeeIds,
  employeesById,
  teamsById,
  users,
  timeEntries,
  leaveRequests,
) {
  const activities = [
    ...getLeaveActivities(leaveRequests, employeesById),
    ...getLatestTimeActivities(timeEntries, employeesById),
  ];

  if (user.role === USER_ROLES.ADMINISTRATOR || user.role === USER_ROLES.HR) {
    activities.push(
      ...getEmployeeActivities(
        users.filter((item) => scopedEmployeeIds.has(item.employeeId)),
        employeesById,
        teamsById,
      ),
    );
  }

  return activities
    .sort((first, second) => second.timestamp.localeCompare(first.timestamp))
    .slice(0, 5);
}

function getKpis({
  user,
  currentEmployee,
  scopedEmployees,
  scopedLeaveRequests,
  scopedTimeEntries,
  notifications,
  today,
}) {
  const pendingRequests = scopedLeaveRequests.filter(
    (request) => request.status === LEAVE_REQUEST_STATUSES.PENDING,
  ).length;
  const totalMinutes = scopedTimeEntries
    .filter((entry) => entry.status === TIME_ENTRY_STATUSES.COMPLETE)
    .reduce(
      (total, entry) =>
        total + calculateWorkedMinutes(entry.startTime, entry.endTime),
      0,
    );

  if (user.role === USER_ROLES.MANAGER) {
    const availableEmployees = scopedEmployees.filter(
      (employee) =>
        !isEmployeeUnavailable(employee, scopedLeaveRequests, today),
    ).length;

    return [
      { label: 'Team members', value: scopedEmployees.length },
      { label: 'Available today', value: availableEmployees },
      { label: 'Hours logged', value: formatMinutes(totalMinutes) },
      { label: 'Pending approvals', value: pendingRequests },
    ];
  }

  if (user.role === USER_ROLES.EMPLOYEE) {
    const approvedAnnualLeave = scopedLeaveRequests
      .filter(
        (request) =>
          request.type === LEAVE_TYPES.ANNUAL &&
          request.status === LEAVE_REQUEST_STATUSES.APPROVED &&
          request.startDate.startsWith(today.slice(0, 4)),
      )
      .reduce((total, request) => total + request.workingDays, 0);
    const leaveAvailable = Math.max(
      (currentEmployee?.annualLeaveAllowance ?? 0) - approvedAnnualLeave,
      0,
    );
    const unreadNotifications = notifications.filter(
      (notification) => notification.userId === user.id && !notification.isRead,
    ).length;

    return [
      { label: 'Hours logged', value: formatMinutes(totalMinutes) },
      { label: 'Leave available', value: `${leaveAvailable} days` },
      { label: 'Pending requests', value: pendingRequests },
      { label: 'Unread updates', value: unreadNotifications },
    ];
  }

  const activeEmployees = scopedEmployees.filter(
    (employee) => employee.status === EMPLOYMENT_STATUSES.ACTIVE,
  ).length;

  return [
    { label: 'Employees', value: scopedEmployees.length },
    { label: 'Active employees', value: activeEmployees },
    { label: 'Hours logged', value: formatMinutes(totalMinutes) },
    { label: 'Pending leave', value: pendingRequests },
  ];
}

function getDashboardCopy(user, companyName) {
  if (user.role === USER_ROLES.MANAGER) {
    return {
      eyebrow: 'Team workspace',
      title: 'Your team at a glance',
      description:
        'Review team availability, working time and requests that need your attention.',
    };
  }

  if (user.role === USER_ROLES.EMPLOYEE) {
    return {
      eyebrow: 'Personal workspace',
      title: 'Your work overview',
      description:
        'Keep track of your working time, leave balance and recent updates.',
    };
  }

  return {
    eyebrow: 'Company workspace',
    title: `${companyName} at a glance`,
    description:
      'Review people data, working time and current leave activity across the company.',
  };
}

export function getDashboardData(user, currentEmployee, company) {
  if (!user || !company) {
    return null;
  }

  const today = toDateString(new Date());
  const employees = employeeRepository.getAllByCompany(company.id);
  const teams = teamRepository.getAllByCompany(company.id);
  const users = userRepository.getAllByCompany(company.id);
  const timeEntries = timeEntryRepository.getAllByCompany(company.id);
  const leaveRequests = leaveRequestRepository.getAllByCompany(company.id);
  const notifications = notificationRepository.getAllByCompany(company.id);
  const scopedEmployees = getScopedEmployees(user, currentEmployee, employees);
  const scopedEmployeeIds = new Set(
    scopedEmployees.map((employee) => employee.id),
  );
  const scopedTimeEntries = timeEntries.filter((entry) =>
    scopedEmployeeIds.has(entry.employeeId),
  );
  const scopedLeaveRequests = leaveRequests.filter((request) =>
    scopedEmployeeIds.has(request.employeeId),
  );
  const latestRecordedDate =
    timeEntries
      .map((entry) => entry.date)
      .sort()
      .at(-1) ?? today;
  const weekDays = getWeekDays(latestRecordedDate);
  const weekDateIds = new Set(weekDays.map((day) => day.date));
  const weeklyScopedTimeEntries = scopedTimeEntries.filter((entry) =>
    weekDateIds.has(entry.date),
  );
  const employeesById = new Map(
    employees.map((employee) => [employee.id, employee]),
  );
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  return {
    ...getDashboardCopy(user, company.name),
    kpis: getKpis({
      user,
      currentEmployee,
      scopedEmployees,
      scopedLeaveRequests,
      scopedTimeEntries: weeklyScopedTimeEntries,
      notifications,
      today,
    }),
    weeklyAttendance: getWeeklyAttendance(weeklyScopedTimeEntries, weekDays),
    weekLabel: `${formatDateRange(
      weekDays[0].date,
      weekDays.at(-1).date,
    )}, ${weekDays[0].date.slice(0, 4)}`,
    teamAvailability: getTeamAvailability(
      scopedEmployees,
      teams,
      scopedLeaveRequests,
      today,
    ),
    recentActivity: getRecentActivity(
      user,
      scopedEmployeeIds,
      employeesById,
      teamsById,
      users,
      scopedTimeEntries,
      scopedLeaveRequests,
    ),
  };
}
