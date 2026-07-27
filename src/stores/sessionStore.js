import { computed, readonly, reactive } from 'vue';
import { USER_ACCESS_STATUSES } from '../domain/index.js';
import {
  companyRepository,
  employeeRepository,
  userRepository,
} from '../repositories/index.js';

export const LOCAL_SESSION_KEY = 'hr-flow.session';
export const DEMO_USER_ID = 'user-olivia';

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

function getStoredSession() {
  const storedSession = globalThis.localStorage.getItem(LOCAL_SESSION_KEY);

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

  globalThis.localStorage.removeItem(LOCAL_SESSION_KEY);

  return null;
}

function saveSession(userId) {
  globalThis.localStorage.setItem(
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
    globalThis.localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  state.initialized = true;

  return state.user !== null;
}

export function signInUser(userId) {
  if (!loadUser(userId)) {
    return false;
  }

  saveSession(userId);

  return true;
}

export function signInDemoUser() {
  return signInUser(DEMO_USER_ID);
}

export function signOut() {
  globalThis.localStorage.removeItem(LOCAL_SESSION_KEY);
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
