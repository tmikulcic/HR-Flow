import { createFirestoreRepository } from './createFirestoreRepository.js';

export {
  clearFirestoreDatabase,
  initializeFirestoreDatabase,
  seedFirestoreDatabase,
  waitForPendingFirestoreWrites,
} from './firestoreDatabase.js';

export const companyRepository = createFirestoreRepository('companies');
export const userRepository = createFirestoreRepository('users');
export const employeeRepository = createFirestoreRepository('employees');
export const teamRepository = createFirestoreRepository('teams');
export const timeEntryRepository = createFirestoreRepository('timeEntries');
export const leaveRequestRepository =
  createFirestoreRepository('leaveRequests');
export const notificationRepository =
  createFirestoreRepository('notifications');
