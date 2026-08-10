import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
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

function getSeedDatabase() {
  return Object.fromEntries(
    DATABASE_COLLECTIONS.map((collectionName) => [
      collectionName,
      clone(seedDatabase[collectionName]),
    ]),
  );
}

async function loadFirestoreDatabase() {
  const collectionEntries = await Promise.all(
    DATABASE_COLLECTIONS.map(async (collectionName) => {
      const snapshot = await getDocs(collection(firestoreDb, collectionName));
      const records = snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      }));

      return [collectionName, records];
    }),
  );

  return Object.fromEntries(collectionEntries);
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

export async function initializeFirestoreDatabase() {
  if (initialized) {
    return getFirestoreDatabase();
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      const loadedDatabase = await loadFirestoreDatabase();
      const isEmpty = loadedDatabase.companies.length === 0;

      database = isEmpty
        ? await seedFirestoreDatabase()
        : clone(loadedDatabase);
      initialized = true;

      return getFirestoreDatabase();
    })().catch((error) => {
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
