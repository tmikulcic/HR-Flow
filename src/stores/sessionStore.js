import { computed, readonly, reactive } from 'vue';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { USER_ACCESS_STATUSES } from '../domain/index.js';
import { firebaseAuth } from '../firebase.js';
import {
  companyRepository,
  employeeRepository,
  userRepository,
} from '../repositories/index.js';

export const LOCAL_SESSION_KEY = 'hr-flow.session';

const state = reactive({
  authUid: null,
  user: null,
  employee: null,
  company: null,
  initialized: false,
});

let initializationPromise = null;

function clearState() {
  state.authUid = null;
  state.user = null;
  state.employee = null;
  state.company = null;
}

function clearLegacySession() {
  globalThis.localStorage.removeItem(LOCAL_SESSION_KEY);
  globalThis.sessionStorage.removeItem(LOCAL_SESSION_KEY);
}

function getUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();

  return userRepository
    .getAll()
    .find((user) => user.email.toLowerCase() === normalizedEmail);
}

export function connectAuthenticatedUser(firebaseUser) {
  clearState();

  if (!firebaseUser?.email) {
    return false;
  }

  const user = getUserByEmail(firebaseUser.email);

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

  state.authUid = firebaseUser.uid;
  state.user = user;
  state.employee = employee;
  state.company = company;

  return true;
}

function handleAuthState(firebaseUser) {
  const isAuthenticated = connectAuthenticatedUser(firebaseUser);

  if (firebaseUser && !isAuthenticated) {
    void firebaseSignOut(firebaseAuth);
  }

  state.initialized = true;

  return isAuthenticated;
}

export function initializeSession() {
  clearLegacySession();

  if (state.initialized) {
    return Promise.resolve(handleAuthState(firebaseAuth.currentUser));
  }

  if (!initializationPromise) {
    initializationPromise = new Promise((resolve) => {
      onAuthStateChanged(
        firebaseAuth,
        (firebaseUser) => {
          resolve(handleAuthState(firebaseUser));
        },
        () => {
          clearState();
          state.initialized = true;
          resolve(false);
        },
      );
    });
  }

  return initializationPromise;
}

export async function signOut() {
  await firebaseSignOut(firebaseAuth);
  clearState();
}

const sessionStore = Object.freeze({
  state: readonly(state),
  currentAuthUid: computed(() => state.authUid),
  currentUser: computed(() => state.user),
  currentEmployee: computed(() => state.employee),
  currentCompany: computed(() => state.company),
  currentRole: computed(() => state.user?.role ?? null),
  isAuthenticated: computed(() => state.user !== null),
  isInitialized: computed(() => state.initialized),
  initializeSession,
  signOut,
});

export function useSessionStore() {
  return sessionStore;
}
