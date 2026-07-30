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
