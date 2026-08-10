import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { USER_ACCESS_STATUSES, USER_ROLE_LABELS } from '../domain/index.js';
import { firebaseAuth } from '../firebase.js';
import { userRepository } from '../repositories/index.js';
import { connectAuthenticatedUser } from '../stores/sessionStore.js';

export const DEMO_CREDENTIALS = Object.freeze({
  email: 'marcus.brown@northstar.io',
  password: 'password',
});

const DEMO_USER_IDS = Object.freeze([
  'user-marcus',
  'user-olivia',
  'user-daniel',
  'user-james',
]);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getApplicationUser(email) {
  const normalizedEmail = normalizeEmail(email);

  return userRepository
    .getAll()
    .find((user) => user.email.toLowerCase() === normalizedEmail);
}

function getAuthenticationError(error) {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password you entered is incorrect.';
    case 'auth/user-disabled':
      return 'This account is currently unavailable.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Unable to reach Firebase. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this project.';
    default:
      return 'Unable to sign in. Please try again.';
  }
}

export function getDemoAccounts() {
  return DEMO_USER_IDS.map((userId) => userRepository.getById(userId))
    .filter(Boolean)
    .map((user) => ({
      email: user.email,
      role: USER_ROLE_LABELS[user.role],
    }));
}

export async function signInWithCredentials(email, password, rememberMe) {
  const normalizedEmail = normalizeEmail(email);
  const applicationUser = getApplicationUser(normalizedEmail);

  if (!applicationUser) {
    return {
      success: false,
      error: 'The email or password you entered is incorrect.',
    };
  }

  if (applicationUser.accessStatus !== USER_ACCESS_STATUSES.ACTIVE) {
    return {
      success: false,
      error: 'This account is currently unavailable.',
    };
  }

  try {
    await setPersistence(
      firebaseAuth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    );

    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      normalizedEmail,
      password,
    );

    if (!connectAuthenticatedUser(credential.user)) {
      await firebaseSignOut(firebaseAuth);

      return {
        success: false,
        error: 'This account is not connected to an HR-Flow user.',
      };
    }

    return { success: true, error: '' };
  } catch (error) {
    return {
      success: false,
      error: getAuthenticationError(error),
    };
  }
}

export async function requestPasswordReset(email) {
  const normalizedEmail = normalizeEmail(email);
  const applicationUser = getApplicationUser(normalizedEmail);

  if (!applicationUser) {
    return { success: true, error: '' };
  }

  try {
    await sendPasswordResetEmail(firebaseAuth, normalizedEmail);

    return { success: true, error: '' };
  } catch (error) {
    if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Enter a valid work email.' };
    }

    if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        error: 'Unable to reach Firebase. Check your connection and try again.',
      };
    }

    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        error: 'Too many reset attempts. Please try again later.',
      };
    }

    return {
      success: false,
      error: 'Unable to send the password reset email. Please try again.',
    };
  }
}
