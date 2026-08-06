import { USER_ACCESS_STATUSES, USER_ROLE_LABELS } from '../domain/index.js';
import { userRepository } from '../repositories/index.js';
import { signInUser } from '../stores/sessionStore.js';

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

export function getDemoAccounts() {
  return DEMO_USER_IDS.map((userId) => userRepository.getById(userId))
    .filter(Boolean)
    .map((user) => ({
      email: user.email,
      role: USER_ROLE_LABELS[user.role],
    }));
}

export function signInWithCredentials(email, password, rememberMe) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = userRepository
    .getAll()
    .find((account) => account.email.toLowerCase() === normalizedEmail);

  if (!user || password !== DEMO_CREDENTIALS.password) {
    return {
      success: false,
      error: 'The email or password you entered is incorrect.',
    };
  }

  if (user.accessStatus !== USER_ACCESS_STATUSES.ACTIVE) {
    return {
      success: false,
      error: 'This account is currently unavailable.',
    };
  }

  if (!signInUser(user.id, rememberMe)) {
    return {
      success: false,
      error: 'This account is currently unavailable.',
    };
  }

  return { success: true, error: '' };
}
