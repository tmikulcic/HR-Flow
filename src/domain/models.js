/**
 * Domain structures used by HR-Flow.
 *
 * Dates use the YYYY-MM-DD format. Timestamps use ISO 8601 strings.
 * Every business record includes companyId so data can later be isolated
 * by company in Firebase.
 */

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} name
 * @property {string} timezone
 * @property {string} createdAt
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} companyId
 * @property {string} email
 * @property {import('./constants.js').UserRole} role
 * @property {import('./constants.js').UserAccessStatus} accessStatus
 * @property {string|null} employeeId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Employee
 * @property {string} id
 * @property {string} companyId
 * @property {string|null} userId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {string} jobTitle
 * @property {string|null} teamId
 * @property {string|null} managerId
 * @property {string} location
 * @property {import('./constants.js').EmploymentType} employmentType
 * @property {import('./constants.js').EmploymentStatus} status
 * @property {string} startDate
 * @property {number} annualLeaveAllowance
 */

/**
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} companyId
 * @property {string} name
 * @property {string|null} managerId
 */

/**
 * @typedef {Object} TimeEntry
 * @property {string} id
 * @property {string} companyId
 * @property {string} employeeId
 * @property {string|null} managerId
 * @property {string} date
 * @property {string} startTime
 * @property {string} endTime
 * @property {number} totalMinutes
 * @property {import('./constants.js').TimeEntryStatus} status
 */

/**
 * @typedef {Object} LeaveRequest
 * @property {string} id
 * @property {string} companyId
 * @property {string} employeeId
 * @property {string} managerId
 * @property {import('./constants.js').LeaveType} type
 * @property {string} startDate
 * @property {string} endDate
 * @property {number} workingDays
 * @property {string} reason
 * @property {import('./constants.js').LeaveRequestStatus} status
 * @property {string|null} managerComment
 * @property {string} createdAt
 * @property {string|null} decidedAt
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} companyId
 * @property {string} userId
 * @property {import('./constants.js').NotificationType} type
 * @property {string} title
 * @property {string} message
 * @property {string|null} relatedEntityType
 * @property {string|null} relatedEntityId
 * @property {boolean} isRead
 * @property {string} createdAt
 */

export {};
