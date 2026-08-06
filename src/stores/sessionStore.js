import { computed, readonly, reactive } from 'vue';
import { USER_ACCESS_STATUSES } from '../domain/index.js';
import {
  companyRepository,
  employeeRepository,
  userRepository,
} from '../repositories/index.js';

export const LOCAL_SESSION_KEY = 'hr-flow.session';
export const DEMO_USER_ID = 'user-marcus';

const SESSION_VERSION = 1;

const state = reactive({
  user: null,
  employee: null,
  company: null,
  initialized: false,
});

function clearState() {
  state.user = null;
  state.employee = null;
  state.company = null;
}

function getSessionFromStorage(storage) {
  const storedSession = storage.getItem(LOCAL_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession);

    if (session.version === SESSION_VERSION && session.userId) {
      return session;
    }
  } catch {
    // Invalid session data is removed below.
  }

  storage.removeItem(LOCAL_SESSION_KEY);

  return null;
}

function getStoredSession() {
  return (
    getSessionFromStorage(globalThis.localStorage) ??
    getSessionFromStorage(globalThis.sessionStorage)
  );
}

function clearStoredSession() {
  globalThis.localStorage.removeItem(LOCAL_SESSION_KEY);
  globalThis.sessionStorage.removeItem(LOCAL_SESSION_KEY);
}

function saveSession(userId, rememberMe) {
  clearStoredSession();

  const storage = rememberMe
    ? globalThis.localStorage
    : globalThis.sessionStorage;

  storage.setItem(
    LOCAL_SESSION_KEY,
    JSON.stringify({
      version: SESSION_VERSION,
      userId,
    }),
  );
}

function loadUser(userId) {
  const user = userRepository.getById(userId);

  if (!user || user.accessStatus !== USER_ACCESS_STATUSES.ACTIVE) {
    return false;
  }

  const company = companyRepository.getById(user.companyId);
  const employee = user.employeeId
    ? employeeRepository.getById(user.employeeId)
    : null;

  if (!company) {
    return false;
  }

  state.user = user;
  state.employee = employee;
  state.company = company;

  return true;
}

export function initializeSession() {
  const storedSession = getStoredSession();

  clearState();

  if (storedSession && !loadUser(storedSession.userId)) {
    clearStoredSession();
  }

  state.initialized = true;

  return state.user !== null;
}

export function signInUser(userId, rememberMe = true) {
  if (!loadUser(userId)) {
    return false;
  }

  saveSession(userId, rememberMe);

  return true;
}

export function signInDemoUser(rememberMe = true) {
  return signInUser(DEMO_USER_ID, rememberMe);
}

export function signOut() {
  clearStoredSession();
  clearState();
}

const sessionStore = Object.freeze({
  state: readonly(state),
  currentUser: computed(() => state.user),
  currentEmployee: computed(() => state.employee),
  currentCompany: computed(() => state.company),
  currentRole: computed(() => state.user?.role ?? null),
  isAuthenticated: computed(() => state.user !== null),
  isInitialized: computed(() => state.initialized),
  initializeSession,
  signInUser,
  signInDemoUser,
  signOut,
});

export function useSessionStore() {
  return sessionStore;
}
