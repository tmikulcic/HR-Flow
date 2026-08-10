import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '../firebase.js';
import {
  DATABASE_COLLECTIONS,
  getFirestoreCollection,
  queueFirestoreWrite,
} from './firestoreDatabase.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createFirestoreRepository(collectionName) {
  if (!DATABASE_COLLECTIONS.includes(collectionName)) {
    throw new Error(`Unknown Firestore collection: ${collectionName}`);
  }

  return Object.freeze({
    getAll() {
      return clone(getFirestoreCollection(collectionName));
    },

    getAllByCompany(companyId) {
      return this.getAll().filter((record) =>
        collectionName === 'companies'
          ? record.id === companyId
          : record.companyId === companyId,
      );
    },

    getById(id) {
      return this.getAll().find((record) => record.id === id) ?? null;
    },

    add(record) {
      if (!record?.id) {
        throw new Error(`A new ${collectionName} record must have an ID.`);
      }

      const collectionRecords = getFirestoreCollection(collectionName);

      if (collectionRecords.some((item) => item.id === record.id)) {
        throw new Error(
          `A ${collectionName} record with ID "${record.id}" already exists.`,
        );
      }

      const newRecord = clone(record);
      collectionRecords.push(newRecord);
      queueFirestoreWrite(() =>
        setDoc(doc(firestoreDb, collectionName, newRecord.id), newRecord),
      );

      return clone(newRecord);
    },

    update(id, changes) {
      const collectionRecords = getFirestoreCollection(collectionName);
      const recordIndex = collectionRecords.findIndex(
        (record) => record.id === id,
      );

      if (recordIndex === -1) {
        return null;
      }

      const currentRecord = collectionRecords[recordIndex];
      const updatedRecord = {
        ...currentRecord,
        ...clone(changes),
        id: currentRecord.id,
      };

      if ('companyId' in currentRecord) {
        updatedRecord.companyId = currentRecord.companyId;
      }

      collectionRecords[recordIndex] = updatedRecord;
      queueFirestoreWrite(() =>
        setDoc(doc(firestoreDb, collectionName, id), updatedRecord),
      );

      return clone(updatedRecord);
    },

    remove(id) {
      const collectionRecords = getFirestoreCollection(collectionName);
      const recordIndex = collectionRecords.findIndex(
        (record) => record.id === id,
      );

      if (recordIndex === -1) {
        return false;
      }

      collectionRecords.splice(recordIndex, 1);
      queueFirestoreWrite(() =>
        deleteDoc(doc(firestoreDb, collectionName, id)),
      );

      return true;
    },
  });
}
