import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  USER_ACCESS_STATUSES,
  USER_ROLE_LABELS,
  USER_ROLES,
} from '../domain/index.js';
import {
  employeeRepository,
  teamRepository,
  userRepository,
} from '../repositories/index.js';

const EMPLOYMENT_TYPE_LABELS = Object.freeze({
  [EMPLOYMENT_TYPES.FULL_TIME]: 'Full-time',
  [EMPLOYMENT_TYPES.PART_TIME]: 'Part-time',
  [EMPLOYMENT_TYPES.CONTRACTOR]: 'Contractor',
});

const EMPLOYMENT_STATUS_LABELS = Object.freeze({
  [EMPLOYMENT_STATUSES.ACTIVE]: 'Active',
  [EMPLOYMENT_STATUSES.ON_LEAVE]: 'On leave',
  [EMPLOYMENT_STATUSES.INACTIVE]: 'Inactive',
});

function createId(prefix) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function normalizeValues(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    jobTitle: values.jobTitle.trim(),
    location: values.location.trim(),
    startDate: values.startDate,
    annualLeaveAllowance: Number(values.annualLeaveAllowance),
    employmentType: values.employmentType,
    status: values.status,
    teamId: values.teamId,
    managerId: values.managerId || null,
    role: values.role,
  };
}

function validateEmployee(companyId, employeeId, values) {
  const errors = {};
  const employees = employeeRepository.getAllByCompany(companyId);
  const teams = teamRepository.getAllByCompany(companyId);

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
    employees.some(
      (employee) =>
        employee.id !== employeeId &&
        employee.email.toLowerCase() === values.email,
    )
  ) {
    errors.email = 'An employee with this email already exists.';
  }

  if (!values.jobTitle) {
    errors.jobTitle = 'Job title is required.';
  }

  if (!values.location) {
    errors.location = 'Location is required.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (
    !Number.isInteger(values.annualLeaveAllowance) ||
    values.annualLeaveAllowance < 0
  ) {
    errors.annualLeaveAllowance = 'Enter a valid number of leave days.';
  }

  if (!Object.values(EMPLOYMENT_TYPES).includes(values.employmentType)) {
    errors.employmentType = 'Select a valid employment type.';
  }

  if (!Object.values(EMPLOYMENT_STATUSES).includes(values.status)) {
    errors.status = 'Select a valid employment status.';
  }

  if (!teams.some((team) => team.id === values.teamId)) {
    errors.teamId = 'Select a valid team.';
  }

  if (
    values.managerId &&
    (!employees.some((employee) => employee.id === values.managerId) ||
      values.managerId === employeeId)
  ) {
    errors.managerId = 'Select a valid manager.';
  }

  if (!Object.values(USER_ROLES).includes(values.role)) {
    errors.role = 'Select a valid system role.';
  }

  return errors;
}

export function getEmployeeFormData(companyId, employeeId = '') {
  const employee = employeeId
    ? employeeRepository
        .getAllByCompany(companyId)
        .find((item) => item.id === employeeId)
    : null;
  const user = employee?.userId
    ? userRepository
        .getAllByCompany(companyId)
        .find((item) => item.id === employee.userId)
    : null;

  return {
    firstName: employee?.firstName ?? '',
    lastName: employee?.lastName ?? '',
    email: employee?.email ?? '',
    phone: employee?.phone ?? '',
    jobTitle: employee?.jobTitle ?? '',
    location: employee?.location ?? '',
    startDate: employee?.startDate ?? '',
    annualLeaveAllowance: employee?.annualLeaveAllowance ?? 24,
    employmentType: employee?.employmentType ?? EMPLOYMENT_TYPES.FULL_TIME,
    status: employee?.status ?? EMPLOYMENT_STATUSES.ACTIVE,
    teamId: employee?.teamId ?? '',
    managerId: employee?.managerId ?? '',
    role: user?.role ?? USER_ROLES.EMPLOYEE,
  };
}

export function getEmployeeFormOptions(companyId, employeeId = '') {
  const teams = teamRepository
    .getAllByCompany(companyId)
    .sort((first, second) => first.name.localeCompare(second.name));
  const employees = employeeRepository
    .getAllByCompany(companyId)
    .filter((employee) => employee.id !== employeeId)
    .sort((first, second) =>
      `${first.firstName} ${first.lastName}`.localeCompare(
        `${second.firstName} ${second.lastName}`,
      ),
    );

  return {
    teams: teams.map((team) => ({ value: team.id, label: team.name })),
    managers: [
      { value: '', label: 'No manager' },
      ...employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
      })),
    ],
    roles: Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    employmentTypes: Object.entries(EMPLOYMENT_TYPE_LABELS).map(
      ([value, label]) => ({ value, label }),
    ),
    statuses: Object.entries(EMPLOYMENT_STATUS_LABELS).map(
      ([value, label]) => ({ value, label }),
    ),
  };
}

export function saveEmployee(companyId, employeeId, formValues) {
  const values = normalizeValues(formValues);
  const errors = validateEmployee(companyId, employeeId, values);

  if (Object.keys(errors).length) {
    return { success: false, errors, employee: null };
  }

  const currentEmployee = employeeId
    ? employeeRepository.getById(employeeId)
    : null;

  if (employeeId && currentEmployee?.companyId !== companyId) {
    return {
      success: false,
      errors: { form: 'Employee could not be found.' },
      employee: null,
    };
  }

  const employeeRecord = {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    jobTitle: values.jobTitle,
    location: values.location,
    startDate: values.startDate,
    annualLeaveAllowance: values.annualLeaveAllowance,
    employmentType: values.employmentType,
    status: values.status,
    teamId: values.teamId,
    managerId: values.managerId,
  };

  if (currentEmployee) {
    const user = currentEmployee.userId
      ? userRepository.getById(currentEmployee.userId)
      : null;

    employeeRepository.update(employeeId, employeeRecord);

    if (user) {
      userRepository.update(user.id, {
        email: values.email,
        role: values.role,
      });
    } else {
      const userId = createId('user');

      userRepository.add({
        id: userId,
        companyId,
        email: values.email,
        role: values.role,
        accessStatus: USER_ACCESS_STATUSES.ACTIVE,
        employeeId,
        createdAt: new Date().toISOString(),
      });
      employeeRepository.update(employeeId, { userId });
    }

    return {
      success: true,
      errors: {},
      employee: employeeRepository.getById(employeeId),
    };
  }

  const newEmployeeId = createId('employee');
  const newUserId = createId('user');
  const employee = employeeRepository.add({
    id: newEmployeeId,
    companyId,
    userId: newUserId,
    ...employeeRecord,
  });

  userRepository.add({
    id: newUserId,
    companyId,
    email: values.email,
    role: values.role,
    accessStatus: USER_ACCESS_STATUSES.ACTIVE,
    employeeId: newEmployeeId,
    createdAt: new Date().toISOString(),
  });

  return { success: true, errors: {}, employee };
}
