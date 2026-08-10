import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { firebaseAuth } from '../firebase.js';
import { initializeFirestoreDatabase } from '../repositories/index.js';
import { connectAuthenticatedUser } from '../stores/sessionStore.js';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
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

export async function signInWithCredentials(email, password, rememberMe) {
  const normalizedEmail = normalizeEmail(email);

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

    try {
      await initializeFirestoreDatabase(credential.user);
    } catch {
      await firebaseSignOut(firebaseAuth);

      return {
        success: false,
        error: 'Unable to load HR-Flow data from Firestore.',
      };
    }

    if (!connectAuthenticatedUser(credential.user)) {
      await firebaseSignOut(firebaseAuth);

      return {
        success: false,
        error: 'This account is currently unavailable.',
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
