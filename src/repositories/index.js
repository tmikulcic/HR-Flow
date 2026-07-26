import { createLocalRepository } from './createLocalRepository.js';

export {
  initializeLocalDatabase,
  LOCAL_DATABASE_KEY,
  resetLocalDatabase,
} from './localDatabase.js';

export const companyRepository = createLocalRepository('companies');
export const userRepository = createLocalRepository('users');
export const employeeRepository = createLocalRepository('employees');
export const teamRepository = createLocalRepository('teams');
export const timeEntryRepository = createLocalRepository('timeEntries');
export const leaveRequestRepository = createLocalRepository('leaveRequests');
export const notificationRepository = createLocalRepository('notifications');
