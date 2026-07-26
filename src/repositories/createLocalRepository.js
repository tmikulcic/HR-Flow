import {
  DATABASE_COLLECTIONS,
  getLocalDatabase,
  saveLocalDatabase,
} from './localDatabase.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createLocalRepository(collectionName) {
  if (!DATABASE_COLLECTIONS.includes(collectionName)) {
    throw new Error(`Unknown local database collection: ${collectionName}`);
  }

  return Object.freeze({
    getAll() {
      return getLocalDatabase()[collectionName];
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

      const database = getLocalDatabase();

      if (database[collectionName].some((item) => item.id === record.id)) {
        throw new Error(
          `A ${collectionName} record with ID "${record.id}" already exists.`,
        );
      }

      const newRecord = clone(record);
      database[collectionName].push(newRecord);
      saveLocalDatabase(database);

      return clone(newRecord);
    },

    update(id, changes) {
      const database = getLocalDatabase();
      const recordIndex = database[collectionName].findIndex(
        (record) => record.id === id,
      );

      if (recordIndex === -1) {
        return null;
      }

      const currentRecord = database[collectionName][recordIndex];
      const updatedRecord = {
        ...currentRecord,
        ...clone(changes),
        id: currentRecord.id,
      };

      if ('companyId' in currentRecord) {
        updatedRecord.companyId = currentRecord.companyId;
      }

      database[collectionName][recordIndex] = updatedRecord;
      saveLocalDatabase(database);

      return clone(updatedRecord);
    },

    remove(id) {
      const database = getLocalDatabase();
      const recordIndex = database[collectionName].findIndex(
        (record) => record.id === id,
      );

      if (recordIndex === -1) {
        return false;
      }

      database[collectionName].splice(recordIndex, 1);
      saveLocalDatabase(database);

      return true;
    },
  });
}
