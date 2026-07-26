import { SEED_VERSION, seedDatabase } from '../data/seed.js';

export const LOCAL_DATABASE_KEY = 'hr-flow.database';

export const DATABASE_COLLECTIONS = Object.freeze([
  'companies',
  'users',
  'employees',
  'teams',
  'timeEntries',
  'leaveRequests',
  'notifications',
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStorage() {
  if (!globalThis.localStorage) {
    throw new Error('Local storage is not available.');
  }

  return globalThis.localStorage;
}

function isValidDatabase(database) {
  return (
    database?.version === SEED_VERSION &&
    DATABASE_COLLECTIONS.every((collection) =>
      Array.isArray(database[collection]),
    )
  );
}

export function resetLocalDatabase() {
  const database = clone(seedDatabase);
  getStorage().setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));

  return clone(database);
}

export function getLocalDatabase() {
  const storedDatabase = getStorage().getItem(LOCAL_DATABASE_KEY);

  if (!storedDatabase) {
    return resetLocalDatabase();
  }

  try {
    const database = JSON.parse(storedDatabase);

    if (isValidDatabase(database)) {
      return clone(database);
    }
  } catch {
    // Invalid local data is replaced with a fresh copy of the seed database.
  }

  return resetLocalDatabase();
}

export function saveLocalDatabase(database) {
  if (!isValidDatabase(database)) {
    throw new Error('Cannot save an invalid local database.');
  }

  getStorage().setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));

  return clone(database);
}

export function initializeLocalDatabase() {
  return getLocalDatabase();
}
