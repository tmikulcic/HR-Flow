import { readonly, ref } from 'vue';
import { NOTIFICATION_TYPES } from '../domain/index.js';
import { notificationRepository } from '../repositories/index.js';

export const LOCAL_NOTIFICATION_PREFERENCES_KEY =
  'hr-flow.notification-preferences';

const DEFAULT_PREFERENCES = Object.freeze({
  leaveUpdates: true,
  timeReminders: true,
  employeeUpdates: true,
});

const notificationVersion = ref(0);
export const notificationDataVersion = readonly(notificationVersion);

const TYPE_DETAILS = Object.freeze({
  [NOTIFICATION_TYPES.LEAVE_REQUEST]: {
    icon: 'approvals',
    preference: 'leaveUpdates',
    link: '/approvals',
  },
  [NOTIFICATION_TYPES.LEAVE_DECISION]: {
    icon: 'calendar',
    preference: 'leaveUpdates',
    link: '/leave-requests',
  },
  [NOTIFICATION_TYPES.TIME_REMINDER]: {
    icon: 'clock',
    preference: 'timeReminders',
    link: '/time-tracking',
  },
  [NOTIFICATION_TYPES.EMPLOYEE_UPDATE]: {
    icon: 'employees',
    preference: 'employeeUpdates',
    link: '/dashboard',
  },
  [NOTIFICATION_TYPES.USER_INVITATION]: {
    icon: 'settings',
    preference: 'employeeUpdates',
    link: '/dashboard',
  },
});

function createId() {
  return `notification-${globalThis.crypto.randomUUID()}`;
}

function getPreferencesDatabase() {
  const storedPreferences = globalThis.localStorage.getItem(
    LOCAL_NOTIFICATION_PREFERENCES_KEY,
  );

  if (!storedPreferences) {
    return {};
  }

  try {
    const preferences = JSON.parse(storedPreferences);

    return preferences && typeof preferences === 'object' ? preferences : {};
  } catch {
    return {};
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getNotificationPreferences(userId) {
  const storedPreferences = getPreferencesDatabase()[userId];

  return {
    ...DEFAULT_PREFERENCES,
    ...(storedPreferences ?? {}),
  };
}

export function saveNotificationPreferences(userId, preferences) {
  const database = getPreferencesDatabase();
  const savedPreferences = {
    leaveUpdates: Boolean(preferences.leaveUpdates),
    timeReminders: Boolean(preferences.timeReminders),
    employeeUpdates: Boolean(preferences.employeeUpdates),
  };

  database[userId] = savedPreferences;
  globalThis.localStorage.setItem(
    LOCAL_NOTIFICATION_PREFERENCES_KEY,
    JSON.stringify(database),
  );
  notificationVersion.value += 1;

  return { ...savedPreferences };
}

export function createNotification(notification) {
  const typeDetails = TYPE_DETAILS[notification.type];
  const preferences = getNotificationPreferences(notification.userId);

  if (!notification.companyId || !notification.userId || !typeDetails) {
    return null;
  }

  if (!preferences[typeDetails.preference]) {
    notificationVersion.value += 1;

    return null;
  }

  const createdNotification = notificationRepository.add({
    id: createId(),
    companyId: notification.companyId,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedEntityType: notification.relatedEntityType ?? null,
    relatedEntityId: notification.relatedEntityId ?? null,
    isRead: false,
    createdAt: notification.createdAt ?? new Date().toISOString(),
  });

  notificationVersion.value += 1;

  return createdNotification;
}

export function getNotificationCenter(companyId, userId) {
  void notificationVersion.value;

  const notifications = notificationRepository
    .getAllByCompany(companyId)
    .filter((notification) => notification.userId === userId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map((notification) => {
      const typeDetails = TYPE_DETAILS[notification.type] ?? {
        icon: 'bell',
        link: '/notifications',
      };

      return {
        ...notification,
        icon: typeDetails.icon,
        link:
          notification.type === NOTIFICATION_TYPES.EMPLOYEE_UPDATE &&
          notification.relatedEntityId
            ? `/employees/${notification.relatedEntityId}`
            : typeDetails.link,
        dateLabel: formatDate(notification.createdAt),
      };
    });

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead)
      .length,
  };
}

export function getUnreadNotificationCount(companyId, userId) {
  return getNotificationCenter(companyId, userId).unreadCount;
}

export function markNotificationAsRead(companyId, userId, notificationId) {
  const notification = notificationRepository.getById(notificationId);

  if (
    !notification ||
    notification.companyId !== companyId ||
    notification.userId !== userId
  ) {
    return false;
  }

  if (!notification.isRead) {
    notificationRepository.update(notificationId, { isRead: true });
    notificationVersion.value += 1;
  }

  return true;
}

export function markAllNotificationsAsRead(companyId, userId) {
  const unreadNotifications = notificationRepository
    .getAllByCompany(companyId)
    .filter(
      (notification) => notification.userId === userId && !notification.isRead,
    );

  unreadNotifications.forEach((notification) => {
    notificationRepository.update(notification.id, { isRead: true });
  });

  if (unreadNotifications.length) {
    notificationVersion.value += 1;
  }

  return unreadNotifications.length;
}
