import { computed, readonly, reactive } from 'vue';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { USER_ACCESS_STATUSES } from '../domain/index.js';
import { firebaseAuth } from '../firebase.js';
import {
  clearFirestoreDatabase,
  companyRepository,
  employeeRepository,
  initializeFirestoreDatabase,
  membershipRepository,
  userRepository,
  waitForPendingFirestoreWrites,
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

export function connectAuthenticatedUser(firebaseUser) {
  clearState();

  if (!firebaseUser?.email) {
    return false;
  }

  const membership = membershipRepository.getById(
    firebaseUser.email.trim().toLowerCase(),
  );
  const user = membership
    ? userRepository.getById(membership.userId)
    : null;

  if (
    !membership ||
    !user ||
    user.companyId !== membership.companyId ||
    user.accessStatus !== USER_ACCESS_STATUSES.ACTIVE
  ) {
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

async function handleAuthState(firebaseUser) {
  if (!firebaseUser) {
    clearFirestoreDatabase();
    clearState();
    state.initialized = true;

    return false;
  }

  try {
    await initializeFirestoreDatabase(firebaseUser);
  } catch {
    clearState();
    state.initialized = true;

    return false;
  }

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
    return handleAuthState(firebaseAuth.currentUser);
  }

  if (!initializationPromise) {
    initializationPromise = new Promise((resolve) => {
      onAuthStateChanged(
        firebaseAuth,
        async (firebaseUser) => {
          resolve(await handleAuthState(firebaseUser));
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
  try {
    await waitForPendingFirestoreWrites();
  } catch {
    // A failed data sync must not prevent the user from signing out.
  }

  await firebaseSignOut(firebaseAuth);
  clearFirestoreDatabase();
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
