import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  USER_ACCESS_STATUSES,
  USER_ROLES,
} from '../domain/index.js';
import { seedDatabase } from '../data/seed.js';
import { firestoreDb } from '../firebase.js';

export const DATABASE_COLLECTIONS = Object.freeze([
  'companies',
  'users',
  'employees',
  'teams',
  'timeEntries',
  'leaveRequests',
  'notifications',
  'memberships',
]);

const COMPANY_COLLECTIONS = Object.freeze([
  'users',
  'employees',
  'teams',
  'timeEntries',
  'leaveRequests',
]);

let database = createEmptyDatabase();
let initializationPromise = null;
let initialized = false;
let pendingWrites = Promise.resolve();
let lastWriteError = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEmptyDatabase() {
  return Object.fromEntries(
    DATABASE_COLLECTIONS.map((collectionName) => [collectionName, []]),
  );
}

function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

export function createMembershipRecord(user) {
  return {
    id: normalizeEmail(user.email),
    userId: user.id,
    companyId: user.companyId,
  };
}

function getSeedDatabase() {
  const initialDatabase = Object.fromEntries(
    COMPANY_COLLECTIONS.map((collectionName) => [
      collectionName,
      clone(seedDatabase[collectionName]),
    ]),
  );

  initialDatabase.companies = clone(seedDatabase.companies);
  initialDatabase.notifications = clone(seedDatabase.notifications);
  initialDatabase.memberships = initialDatabase.users.map(
    createMembershipRecord,
  );

  return initialDatabase;
}

function mapDocument(document) {
  return {
    ...document.data(),
    id: document.id,
  };
}

function deduplicateRecords(records) {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

async function getRecord(collectionName, id) {
  if (!id) {
    return null;
  }

  const snapshot = await getDoc(doc(firestoreDb, collectionName, id));

  return snapshot.exists() ? mapDocument(snapshot) : null;
}

async function getRecords(collectionName, ...constraints) {
  const snapshot = await getDocs(
    query(collection(firestoreDb, collectionName), ...constraints),
  );

  return snapshot.docs.map(mapDocument);
}

async function getCompanyRecords(collectionName, companyId) {
  return getRecords(collectionName, where('companyId', '==', companyId));
}

async function getEmployeeRecords(collectionName, companyId, employeeIds) {
  const recordGroups = await Promise.all(
    [...new Set(employeeIds)].filter(Boolean).map((employeeId) =>
      getRecords(
        collectionName,
        where('companyId', '==', companyId),
        where('employeeId', '==', employeeId),
      ),
    ),
  );

  return deduplicateRecords(recordGroups.flat());
}

async function getRecordsById(collectionName, recordIds) {
  const records = await Promise.all(
    [...new Set(recordIds)].filter(Boolean).map((id) =>
      getRecord(collectionName, id),
    ),
  );

  return records.filter(Boolean);
}

async function seedMemberships(users) {
  const memberships = users.map(createMembershipRecord);
  const batch = writeBatch(firestoreDb);

  memberships.forEach((membership) => {
    batch.set(
      doc(firestoreDb, 'memberships', membership.id),
      clone(membership),
    );
  });

  await batch.commit();

  return memberships;
}

async function getMembership(firebaseUser) {
  const email = normalizeEmail(firebaseUser?.email);

  if (!email) {
    throw new Error('The authenticated Firebase user does not have an email.');
  }

  let membership = await getRecord('memberships', email);

  if (!membership) {
    const users = await getRecords('users');

    if (!users.length) {
      await seedFirestoreDatabase();
    } else {
      await seedMemberships(users);
    }

    membership = await getRecord('memberships', email);
  }

  if (!membership) {
    throw new Error('This Firebase account has no HR-Flow membership.');
  }

  return membership;
}

async function getAccessContext(firebaseUser) {
  const membership = await getMembership(firebaseUser);
  const user = await getRecord('users', membership.userId);

  if (
    !user ||
    user.companyId !== membership.companyId ||
    user.accessStatus !== USER_ACCESS_STATUSES.ACTIVE
  ) {
    throw new Error('This HR-Flow user does not have active access.');
  }

  const [company, employee] = await Promise.all([
    getRecord('companies', membership.companyId),
    getRecord('employees', user.employeeId),
  ]);

  if (!company || !employee || employee.companyId !== membership.companyId) {
    throw new Error('The HR-Flow membership data is incomplete.');
  }

  return { membership, user, company, employee };
}

async function getApproverRecords(companyId) {
  const userGroups = await Promise.all([
    getRecords(
      'users',
      where('companyId', '==', companyId),
      where('role', '==', USER_ROLES.ADMINISTRATOR),
    ),
    getRecords(
      'users',
      where('companyId', '==', companyId),
      where('role', '==', USER_ROLES.HR),
    ),
  ]);
  const users = deduplicateRecords(userGroups.flat());
  const employees = await getRecordsById(
    'employees',
    users.map((user) => user.employeeId),
  );

  return { users, employees };
}

async function loadFullCompanyDatabase(context) {
  const { company, membership, user } = context;
  const [users, employees, teams, timeEntries, leaveRequests, notifications] =
    await Promise.all([
      getCompanyRecords('users', company.id),
      getCompanyRecords('employees', company.id),
      getCompanyRecords('teams', company.id),
      getCompanyRecords('timeEntries', company.id),
      getCompanyRecords('leaveRequests', company.id),
      getRecords(
        'notifications',
        where('companyId', '==', company.id),
        where('userId', '==', user.id),
      ),
    ]);

  return {
    companies: [company],
    users,
    employees,
    teams,
    timeEntries,
    leaveRequests,
    notifications,
    memberships: [membership],
  };
}

async function loadManagerDatabase(context) {
  const { company, employee, membership, user } = context;
  const directReports = await getRecords(
    'employees',
    where('companyId', '==', company.id),
    where('managerId', '==', employee.id),
  );
  const visibleEmployees = deduplicateRecords([employee, ...directReports]);
  const approvers = await getApproverRecords(company.id);
  const employees = deduplicateRecords([
    ...visibleEmployees,
    ...approvers.employees,
  ]);
  const visibleUsers = await getRecordsById(
    'users',
    visibleEmployees.map((record) => record.userId),
  );
  const teams = await getRecordsById(
    'teams',
    visibleEmployees.map((record) => record.teamId),
  );
  const [
    ownTimeEntries,
    managedTimeEntries,
    ownLeaveRequests,
    managedLeaveRequests,
    notifications,
  ] = await Promise.all([
    getEmployeeRecords('timeEntries', company.id, [employee.id]),
    getRecords(
      'timeEntries',
      where('companyId', '==', company.id),
      where('managerId', '==', employee.id),
    ),
    getEmployeeRecords('leaveRequests', company.id, [employee.id]),
    getRecords(
      'leaveRequests',
      where('companyId', '==', company.id),
      where('managerId', '==', employee.id),
    ),
    getRecords(
      'notifications',
      where('companyId', '==', company.id),
      where('userId', '==', user.id),
    ),
  ]);

  return {
    companies: [company],
    users: deduplicateRecords([...visibleUsers, ...approvers.users]),
    employees,
    teams,
    timeEntries: deduplicateRecords([...ownTimeEntries, ...managedTimeEntries]),
    leaveRequests: deduplicateRecords([
      ...ownLeaveRequests,
      ...managedLeaveRequests,
    ]),
    notifications,
    memberships: [membership],
  };
}

async function loadEmployeeDatabase(context) {
  const { company, employee, membership, user } = context;
  const [manager, team, approvers, timeEntries, leaveRequests, notifications] =
    await Promise.all([
      getRecord('employees', employee.managerId),
      getRecord('teams', employee.teamId),
      getApproverRecords(company.id),
      getEmployeeRecords('timeEntries', company.id, [employee.id]),
      getEmployeeRecords('leaveRequests', company.id, [employee.id]),
      getRecords(
        'notifications',
        where('companyId', '==', company.id),
        where('userId', '==', user.id),
      ),
    ]);

  return {
    companies: [company],
    users: deduplicateRecords([user, ...approvers.users]),
    employees: deduplicateRecords([
      employee,
      manager,
      ...approvers.employees,
    ].filter(Boolean)),
    teams: team ? [team] : [],
    timeEntries,
    leaveRequests,
    notifications,
    memberships: [membership],
  };
}

async function loadFirestoreDatabase(firebaseUser) {
  const context = await getAccessContext(firebaseUser);

  if (
    context.user.role === USER_ROLES.ADMINISTRATOR ||
    context.user.role === USER_ROLES.HR
  ) {
    return loadFullCompanyDatabase(context);
  }

  if (context.user.role === USER_ROLES.MANAGER) {
    return loadManagerDatabase(context);
  }

  return loadEmployeeDatabase(context);
}

export async function seedFirestoreDatabase() {
  const initialDatabase = getSeedDatabase();
  const batch = writeBatch(firestoreDb);

  DATABASE_COLLECTIONS.forEach((collectionName) => {
    initialDatabase[collectionName].forEach((record) => {
      batch.set(doc(firestoreDb, collectionName, record.id), clone(record));
    });
  });

  await batch.commit();
  database = initialDatabase;

  return getFirestoreDatabase();
}

export async function initializeFirestoreDatabase(firebaseUser) {
  if (initialized) {
    return getFirestoreDatabase();
  }

  if (!initializationPromise) {
    initializationPromise = loadFirestoreDatabase(firebaseUser)
      .then((loadedDatabase) => {
        database = clone(loadedDatabase);
        initialized = true;

        return getFirestoreDatabase();
      })
      .catch((error) => {
        initializationPromise = null;
        database = createEmptyDatabase();

        throw error;
      });
  }

  return initializationPromise;
}

export function clearFirestoreDatabase() {
  database = createEmptyDatabase();
  initializationPromise = null;
  initialized = false;
  pendingWrites = Promise.resolve();
  lastWriteError = null;
}

export function getFirestoreDatabase() {
  return clone(database);
}

export function getFirestoreCollection(collectionName) {
  if (!DATABASE_COLLECTIONS.includes(collectionName)) {
    throw new Error(`Unknown Firestore collection: ${collectionName}`);
  }

  return database[collectionName];
}

export function queueFirestoreWrite(writeOperation) {
  pendingWrites = pendingWrites
    .then(writeOperation)
    .catch((error) => {
      lastWriteError = error;
      console.error('Unable to synchronize data with Firestore.', error);
    });
}

export async function waitForPendingFirestoreWrites() {
  await pendingWrites;

  if (lastWriteError) {
    const error = lastWriteError;
    lastWriteError = null;

    throw error;
  }
}
