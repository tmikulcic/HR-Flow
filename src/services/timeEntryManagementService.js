import { TIME_ENTRY_STATUSES } from '../domain/index.js';
import {
  employeeRepository,
  timeEntryRepository,
} from '../repositories/index.js';

const DEFAULT_START_TIME = '08:00';
const DEFAULT_END_TIME = '16:30';
const DEFAULT_BREAK_MINUTES = 30;

function createId() {
  return `time-${globalThis.crypto.randomUUID()}`;
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function isWorkingDay(date) {
  const day = new Date(`${date}T12:00:00`).getDay();

  return day >= 1 && day <= 5;
}

function timeToMinutes(time) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

function normalizeValues(values) {
  const breakValue = String(values.breakMinutes ?? '').trim();

  return {
    date: String(values.date ?? '').trim(),
    startTime: String(values.startTime ?? '').trim(),
    endTime: String(values.endTime ?? '').trim(),
    breakMinutes: breakValue === '' ? Number.NaN : Number(breakValue),
  };
}

function validateTimeEntry(companyId, employeeId, entryId, values) {
  const errors = {};
  const startMinutes = timeToMinutes(values.startTime);
  const endMinutes = timeToMinutes(values.endTime);

  if (!values.date) {
    errors.date = 'Date is required.';
  } else if (!isValidDate(values.date)) {
    errors.date = 'Enter a valid date.';
  } else if (!isWorkingDay(values.date)) {
    errors.date = 'Time can only be recorded for a weekday.';
  }

  if (!values.startTime) {
    errors.startTime = 'Start time is required.';
  } else if (startMinutes === null) {
    errors.startTime = 'Enter a valid start time.';
  }

  if (!values.endTime) {
    errors.endTime = 'End time is required.';
  } else if (endMinutes === null) {
    errors.endTime = 'Enter a valid end time.';
  } else if (startMinutes !== null && endMinutes <= startMinutes) {
    errors.endTime = 'End time must be after start time.';
  }

  if (!Number.isInteger(values.breakMinutes) || values.breakMinutes < 0) {
    errors.breakMinutes = 'Enter a valid number of break minutes.';
  } else if (
    startMinutes !== null &&
    endMinutes !== null &&
    endMinutes > startMinutes &&
    values.breakMinutes >= endMinutes - startMinutes
  ) {
    errors.breakMinutes = 'Break must be shorter than the working period.';
  }

  const duplicateEntry = timeEntryRepository
    .getAllByCompany(companyId)
    .find(
      (entry) =>
        entry.employeeId === employeeId &&
        entry.date === values.date &&
        entry.id !== entryId,
    );

  if (
    duplicateEntry &&
    (entryId || duplicateEntry.status !== TIME_ENTRY_STATUSES.MISSING)
  ) {
    errors.date = 'A time entry already exists for this date.';
  }

  return errors;
}

export function getTimeEntryFormData(
  companyId,
  employeeId,
  entryId = '',
  initialDate = '',
) {
  const entry = entryId ? timeEntryRepository.getById(entryId) : null;
  const belongsToEmployee =
    entry?.companyId === companyId && entry?.employeeId === employeeId;

  return {
    date: belongsToEmployee ? entry.date : initialDate,
    startTime:
      belongsToEmployee && entry.startTime
        ? entry.startTime
        : DEFAULT_START_TIME,
    endTime:
      belongsToEmployee && entry.endTime ? entry.endTime : DEFAULT_END_TIME,
    breakMinutes:
      belongsToEmployee && entry.status === TIME_ENTRY_STATUSES.COMPLETE
        ? entry.breakMinutes
        : DEFAULT_BREAK_MINUTES,
  };
}

export function saveTimeEntry(companyId, employeeId, entryId, formValues) {
  const employee = employeeRepository.getById(employeeId);

  if (!employee || employee.companyId !== companyId) {
    return {
      success: false,
      errors: { form: 'Employee could not be found.' },
      entry: null,
    };
  }

  const currentEntry = entryId ? timeEntryRepository.getById(entryId) : null;

  if (
    entryId &&
    (currentEntry?.companyId !== companyId ||
      currentEntry?.employeeId !== employeeId)
  ) {
    return {
      success: false,
      errors: { form: 'Time entry could not be found.' },
      entry: null,
    };
  }

  const values = normalizeValues(formValues);
  const errors = validateTimeEntry(companyId, employeeId, entryId, values);

  if (Object.keys(errors).length) {
    return { success: false, errors, entry: null };
  }

  const startMinutes = timeToMinutes(values.startTime);
  const endMinutes = timeToMinutes(values.endTime);
  const record = {
    managerId: employee.managerId,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    breakMinutes: values.breakMinutes,
    totalMinutes: endMinutes - startMinutes - values.breakMinutes,
    status: TIME_ENTRY_STATUSES.COMPLETE,
  };
  const missingEntry = !currentEntry
    ? timeEntryRepository
        .getAllByCompany(companyId)
        .find(
          (entry) =>
            entry.employeeId === employeeId &&
            entry.date === values.date &&
            entry.status === TIME_ENTRY_STATUSES.MISSING,
        )
    : null;
  const entry =
    currentEntry || missingEntry
      ? timeEntryRepository.update((currentEntry || missingEntry).id, record)
      : timeEntryRepository.add({
          id: createId(),
          companyId,
          employeeId,
          ...record,
        });

  return { success: true, errors: {}, entry };
}
