import { EMPLOYMENT_STATUSES } from '../domain/index.js';
import { employeeRepository, teamRepository } from '../repositories/index.js';

const STATUS_DETAILS = Object.freeze({
  [EMPLOYMENT_STATUSES.ACTIVE]: {
    label: 'Active',
    tone: 'success',
  },
  [EMPLOYMENT_STATUSES.ON_LEAVE]: {
    label: 'On leave',
    tone: 'warning',
  },
  [EMPLOYMENT_STATUSES.INACTIVE]: {
    label: 'Inactive',
    tone: 'neutral',
  },
});

function getEmployeeName(employee) {
  return employee
    ? `${employee.firstName} ${employee.lastName}`
    : 'Not assigned';
}

export function getEmployeeDirectory(companyId) {
  if (!companyId) {
    return [];
  }

  const employees = employeeRepository.getAllByCompany(companyId);
  const teams = teamRepository.getAllByCompany(companyId);
  const employeesById = new Map(
    employees.map((employee) => [employee.id, employee]),
  );
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  return employees
    .map((employee) => {
      const status =
        STATUS_DETAILS[employee.status] ??
        STATUS_DETAILS[EMPLOYMENT_STATUSES.INACTIVE];

      return {
        ...employee,
        fullName: getEmployeeName(employee),
        teamName: teamsById.get(employee.teamId)?.name ?? 'Not assigned',
        managerName: getEmployeeName(employeesById.get(employee.managerId)),
        statusLabel: status.label,
        statusTone: status.tone,
      };
    })
    .sort((first, second) => first.fullName.localeCompare(second.fullName));
}

export function getEmployeeFilterOptions(employees) {
  const teams = new Map();

  employees.forEach((employee) => {
    if (employee.teamId) {
      teams.set(employee.teamId, employee.teamName);
    }
  });

  return {
    teams: [
      { value: '', label: 'All teams' },
      ...[...teams.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((first, second) => first.label.localeCompare(second.label)),
    ],
    statuses: [
      { value: '', label: 'All statuses' },
      ...Object.entries(STATUS_DETAILS).map(([value, details]) => ({
        value,
        label: details.label,
      })),
    ],
  };
}

export function filterEmployeeDirectory(
  employees,
  { search = '', teamId = '', status = '' } = {},
) {
  const normalizedSearch = search.trim().toLowerCase();

  return employees.filter((employee) => {
    const matchesSearch =
      !normalizedSearch ||
      employee.fullName.toLowerCase().includes(normalizedSearch) ||
      employee.email.toLowerCase().includes(normalizedSearch);
    const matchesTeam = !teamId || employee.teamId === teamId;
    const matchesStatus = !status || employee.status === status;

    return matchesSearch && matchesTeam && matchesStatus;
  });
}
