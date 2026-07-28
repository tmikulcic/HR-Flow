import { signInDemoUser } from '../stores/sessionStore.js';

export const DEMO_CREDENTIALS = Object.freeze({
  email: 'olivia.carter@northstar.io',
  password: 'password',
});

export function signInWithCredentials(email, password, rememberMe) {
  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail !== DEMO_CREDENTIALS.email ||
    password !== DEMO_CREDENTIALS.password
  ) {
    return {
      success: false,
      error: 'The email or password you entered is incorrect.',
    };
  }

  if (!signInDemoUser(rememberMe)) {
    return {
      success: false,
      error: 'This account is currently unavailable.',
    };
  }

  return { success: true, error: '' };
}
