import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  NOTIFICATION_TYPES,
  USER_ACCESS_STATUSES,
  USER_ROLE_LABELS,
  USER_ROLES,
} from '../domain/index.js';
import {
  companyRepository,
  employeeRepository,
  teamRepository,
  userRepository,
} from '../repositories/index.js';
import { createNotification } from './notificationService.js';

const ACCESS_DETAILS = Object.freeze({
  [USER_ACCESS_STATUSES.ACTIVE]: {
    label: 'Active',
    tone: 'success',
  },
  [USER_ACCESS_STATUSES.INVITED]: {
    label: 'Invited',
    tone: 'warning',
  },
  [USER_ACCESS_STATUSES.DISABLED]: {
    label: 'Disabled',
    tone: 'neutral',
  },
});

const ROLE_TONES = Object.freeze({
  [USER_ROLES.ADMINISTRATOR]: 'info',
  [USER_ROLES.HR]: 'success',
  [USER_ROLES.MANAGER]: 'warning',
  [USER_ROLES.EMPLOYEE]: 'neutral',
});

export const COMPANY_TIMEZONE_OPTIONS = Object.freeze([
  { value: 'Europe/Zagreb', label: 'Europe/Zagreb' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
]);

function createId(prefix) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function getAdministrator(companyId, administratorUserId) {
  const user = userRepository.getById(administratorUserId);

  if (
    !user ||
    user.companyId !== companyId ||
    user.role !== USER_ROLES.ADMINISTRATOR ||
    user.accessStatus !== USER_ACCESS_STATUSES.ACTIVE
  ) {
    return null;
  }

  return user;
}

function getCreatedLabel(timestamp) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

function normalizeInviteValues(values) {
  return {
    firstName: String(values.firstName ?? '').trim(),
    lastName: String(values.lastName ?? '').trim(),
    email: String(values.email ?? '')
      .trim()
      .toLowerCase(),
    role: String(values.role ?? '').trim(),
    teamId: String(values.teamId ?? '').trim(),
  };
}

function validateInvite(companyId, values) {
  const errors = {};

  if (!values.firstName) {
    errors.firstName = 'First name is required.';
  }

  if (!values.lastName) {
    errors.lastName = 'Last name is required.';
  }

  if (!values.email) {
    errors.email = 'Work email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid work email.';
  } else if (
    userRepository
      .getAll()
      .some((user) => user.email.toLowerCase() === values.email)
  ) {
    errors.email = 'A user with this email already exists.';
  }

  if (!Object.values(USER_ROLES).includes(values.role)) {
    errors.role = 'Select a valid role.';
  }

  if (
    !teamRepository
      .getAllByCompany(companyId)
      .some((team) => team.id === values.teamId)
  ) {
    errors.teamId = 'Select a valid team.';
  }

  return errors;
}

export function getAdministrationOverview(companyId, administratorUserId) {
  if (!getAdministrator(companyId, administratorUserId)) {
    return null;
  }

  const company = companyRepository.getById(companyId);
  const users = userRepository.getAllByCompany(companyId);
  const employees = employeeRepository.getAllByCompany(companyId);
  const teams = teamRepository.getAllByCompany(companyId);
  const employeesById = new Map(
    employees.map((employee) => [employee.id, employee]),
  );
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  return {
    company,
    summary: {
      totalUsers: users.length,
      activeUsers: users.filter(
        (user) => user.accessStatus === USER_ACCESS_STATUSES.ACTIVE,
      ).length,
      invitedUsers: users.filter(
        (user) => user.accessStatus === USER_ACCESS_STATUSES.INVITED,
      ).length,
      totalTeams: teams.length,
    },
    users: users
      .map((user) => {
        const employee = employeesById.get(user.employeeId);
        const access =
          ACCESS_DETAILS[user.accessStatus] ??
          ACCESS_DETAILS[USER_ACCESS_STATUSES.DISABLED];

        return {
          ...user,
          fullName: employee
            ? `${employee.firstName} ${employee.lastName}`
            : user.email,
          jobTitle: employee?.jobTitle ?? 'Employee profile not linked',
          teamId: employee?.teamId ?? '',
          teamName: teamsById.get(employee?.teamId)?.name ?? 'Not assigned',
          roleLabel: USER_ROLE_LABELS[user.role] ?? 'Unknown role',
          roleTone: ROLE_TONES[user.role] ?? 'neutral',
          accessLabel: access.label,
          accessTone: access.tone,
          createdLabel: getCreatedLabel(user.createdAt),
        };
      })
      .sort((first, second) => first.fullName.localeCompare(second.fullName)),
    teams: teams
      .map((team) => {
        const manager = employeesById.get(team.managerId);

        return {
          ...team,
          managerName: manager
            ? `${manager.firstName} ${manager.lastName}`
            : 'Not assigned',
          memberCount: employees.filter(
            (employee) => employee.teamId === team.id,
          ).length,
        };
      })
      .sort((first, second) => first.name.localeCompare(second.name)),
    options: {
      roles: Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      accessStatuses: Object.entries(ACCESS_DETAILS).map(
        ([value, details]) => ({
          value,
          label: details.label,
        }),
      ),
      teams: teams
        .map((team) => ({ value: team.id, label: team.name }))
        .sort((first, second) => first.label.localeCompare(second.label)),
      managers: [
        { value: '', label: 'No manager' },
        ...employees
          .map((employee) => ({
            value: employee.id,
            label: `${employee.firstName} ${employee.lastName}`,
          }))
          .sort((first, second) => first.label.localeCompare(second.label)),
      ],
    },
  };
}

export function inviteUser(companyId, administratorUserId, formValues) {
  if (!getAdministrator(companyId, administratorUserId)) {
    return {
      success: false,
      errors: { form: 'Administrator access is required.' },
      user: null,
    };
  }

  const values = normalizeInviteValues(formValues);
  const errors = validateInvite(companyId, values);

  if (Object.keys(errors).length) {
    return { success: false, errors, user: null };
  }

  const team = teamRepository.getById(values.teamId);
  const userId = createId('user');
  const employeeId = createId('employee');
  const createdAt = new Date().toISOString();
  const employee = employeeRepository.add({
    id: employeeId,
    companyId,
    userId,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: '',
    jobTitle: 'Pending onboarding',
    teamId: team.id,
    managerId: team.managerId,
    location: '',
    employmentType: EMPLOYMENT_TYPES.FULL_TIME,
    status: EMPLOYMENT_STATUSES.ACTIVE,
    startDate: createdAt.slice(0, 10),
    annualLeaveAllowance: 24,
  });
  const user = userRepository.add({
    id: userId,
    companyId,
    email: values.email,
    role: values.role,
    accessStatus: USER_ACCESS_STATUSES.INVITED,
    employeeId,
    createdAt,
  });

  createNotification({
    companyId,
    userId,
    type: NOTIFICATION_TYPES.USER_INVITATION,
    title: 'Welcome to HR-Flow',
    message: 'Your account was created and is waiting for activation.',
    relatedEntityType: 'employee',
    relatedEntityId: employee.id,
    createdAt,
  });

  return { success: true, errors: {}, user };
}

export function updateUserAdministration(
  companyId,
  administratorUserId,
  userId,
  formValues,
) {
  const administrator = getAdministrator(companyId, administratorUserId);

  if (!administrator) {
    return {
      success: false,
      errors: { form: 'Administrator access is required.' },
      user: null,
    };
  }

  const user = userRepository.getById(userId);

  if (!user || user.companyId !== companyId) {
    return {
      success: false,
      errors: { form: 'User could not be found.' },
      user: null,
    };
  }

  const role = String(formValues.role ?? '').trim();
  const accessStatus = String(formValues.accessStatus ?? '').trim();
  const teamId = String(formValues.teamId ?? '').trim();
  const errors = {};

  if (!Object.values(USER_ROLES).includes(role)) {
    errors.role = 'Select a valid role.';
  }

  if (!Object.values(USER_ACCESS_STATUSES).includes(accessStatus)) {
    errors.accessStatus = 'Select a valid access status.';
  }

  const employee = user.employeeId
    ? employeeRepository.getById(user.employeeId)
    : null;
  const team = teamId ? teamRepository.getById(teamId) : null;

  if (teamId && team?.companyId !== companyId) {
    errors.teamId = 'Select a valid team.';
  }

  if (
    user.id === administrator.id &&
    (role !== USER_ROLES.ADMINISTRATOR ||
      accessStatus !== USER_ACCESS_STATUSES.ACTIVE)
  ) {
    errors.form = 'You cannot remove your own administrator access.';
  }

  if (Object.keys(errors).length) {
    return { success: false, errors, user: null };
  }

  const updatedUser = userRepository.update(userId, { role, accessStatus });

  if (employee) {
    employeeRepository.update(employee.id, {
      teamId: teamId || null,
      managerId:
        team?.managerId && team.managerId !== employee.id
          ? team.managerId
          : null,
    });
  }

  createNotification({
    companyId,
    userId,
    type: NOTIFICATION_TYPES.EMPLOYEE_UPDATE,
    title: 'Account settings updated',
    message: `Your role or access was updated by an administrator.`,
    relatedEntityType: 'employee',
    relatedEntityId: employee?.id ?? null,
  });

  return { success: true, errors: {}, user: updatedUser };
}

export function saveTeam(companyId, administratorUserId, teamId, formValues) {
  if (!getAdministrator(companyId, administratorUserId)) {
    return {
      success: false,
      errors: { form: 'Administrator access is required.' },
      team: null,
    };
  }

  const name = String(formValues.name ?? '').trim();
  const managerId = String(formValues.managerId ?? '').trim();
  const errors = {};
  const teams = teamRepository.getAllByCompany(companyId);

  if (!name) {
    errors.name = 'Team name is required.';
  } else if (
    teams.some(
      (team) =>
        team.id !== teamId && team.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'A team with this name already exists.';
  }

  const manager = managerId ? employeeRepository.getById(managerId) : null;

  if (managerId && manager?.companyId !== companyId) {
    errors.managerId = 'Select a valid manager.';
  }

  const currentTeam = teamId ? teamRepository.getById(teamId) : null;

  if (teamId && currentTeam?.companyId !== companyId) {
    errors.form = 'Team could not be found.';
  }

  if (Object.keys(errors).length) {
    return { success: false, errors, team: null };
  }

  const team = currentTeam
    ? teamRepository.update(teamId, {
        name,
        managerId: managerId || null,
      })
    : teamRepository.add({
        id: createId('team'),
        companyId,
        name,
        managerId: managerId || null,
      });

  employeeRepository
    .getAllByCompany(companyId)
    .filter((employee) => employee.teamId === team.id)
    .forEach((employee) => {
      employeeRepository.update(employee.id, {
        managerId:
          team.managerId && team.managerId !== employee.id
            ? team.managerId
            : null,
      });
    });

  return { success: true, errors: {}, team };
}

export function saveCompanySettings(
  companyId,
  administratorUserId,
  formValues,
) {
  if (!getAdministrator(companyId, administratorUserId)) {
    return {
      success: false,
      errors: { form: 'Administrator access is required.' },
      company: null,
    };
  }

  const name = String(formValues.name ?? '').trim();
  const timezone = String(formValues.timezone ?? '').trim();
  const errors = {};

  if (!name) {
    errors.name = 'Company name is required.';
  }

  if (!COMPANY_TIMEZONE_OPTIONS.some((option) => option.value === timezone)) {
    errors.timezone = 'Select a supported timezone.';
  }

  if (Object.keys(errors).length) {
    return { success: false, errors, company: null };
  }

  const company = companyRepository.update(companyId, { name, timezone });

  return { success: true, errors: {}, company };
}
