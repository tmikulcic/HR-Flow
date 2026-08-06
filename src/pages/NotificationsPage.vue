<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import AppIcon from '../components/AppIcon.vue';
import EmptyState from '../components/EmptyState.vue';
import { NOTIFICATION_TYPES } from '../domain/index.js';
import {
  getNotificationCenter,
  getNotificationPreferences,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  saveNotificationPreferences,
} from '../services/notificationService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const router = useRouter();
const selectedFilter = ref('all');
const preferenceMessage = ref('');
const preferences = reactive({
  leaveUpdates: true,
  timeReminders: true,
  employeeUpdates: true,
});

const notificationCenter = computed(() =>
  getNotificationCenter(
    session.currentCompany.value?.id,
    session.currentUser.value?.id,
  ),
);

const filteredNotifications = computed(() =>
  selectedFilter.value === 'unread'
    ? notificationCenter.value.notifications.filter(
        (notification) => !notification.isRead,
      )
    : notificationCenter.value.notifications,
);

const preferenceItems = [
  {
    key: 'leaveUpdates',
    label: 'Leave updates',
    description: 'New requests and manager decisions.',
  },
  {
    key: 'timeReminders',
    label: 'Time reminders',
    description: 'Missing or incomplete time entries.',
  },
  {
    key: 'employeeUpdates',
    label: 'Employee updates',
    description: 'Important profile and access changes.',
  },
];

const iconToneClasses = {
  [NOTIFICATION_TYPES.LEAVE_REQUEST]: 'bg-warning-soft text-warning',
  [NOTIFICATION_TYPES.LEAVE_DECISION]: 'bg-success-soft text-success',
  [NOTIFICATION_TYPES.TIME_REMINDER]: 'bg-info-soft text-info',
  [NOTIFICATION_TYPES.EMPLOYEE_UPDATE]: 'bg-brand-soft text-brand',
  [NOTIFICATION_TYPES.USER_INVITATION]: 'bg-brand-soft text-brand',
};

function handleMarkAllAsRead() {
  markAllNotificationsAsRead(
    session.currentCompany.value?.id,
    session.currentUser.value?.id,
  );
}

function openNotification(notification) {
  markNotificationAsRead(
    session.currentCompany.value?.id,
    session.currentUser.value?.id,
    notification.id,
  );
  router.push(notification.link);
}

function handlePreferenceChange() {
  saveNotificationPreferences(session.currentUser.value?.id, preferences);
  preferenceMessage.value = 'Preferences saved locally.';
}

watch(
  () => session.currentUser.value?.id,
  (userId) => {
    if (userId) {
      Object.assign(preferences, getNotificationPreferences(userId));
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="mx-auto w-full max-w-[1480px]">
    <section
      class="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
        >
          Activity center
        </p>
        <h2>Notifications</h2>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Review updates about leave, working time and employee records.
        </p>
      </div>

      <AppButton
        variant="secondary"
        :disabled="notificationCenter.unreadCount === 0"
        @click="handleMarkAllAsRead"
      >
        Mark all as read
      </AppButton>
    </section>

    <section
      class="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
    >
      <article class="border border-line bg-surface">
        <header
          class="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3>Recent updates</h3>
            <p class="mt-1 text-xs text-muted">
              {{ notificationCenter.unreadCount }} unread
            </p>
          </div>

          <div class="inline-flex self-start bg-surface-soft p-1 sm:self-auto">
            <button
              type="button"
              :class="[
                'rounded-control px-3 py-1.5 text-xs font-semibold transition-colors',
                selectedFilter === 'all'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted hover:text-ink',
              ]"
              @click="selectedFilter = 'all'"
            >
              All
            </button>
            <button
              type="button"
              :class="[
                'rounded-control px-3 py-1.5 text-xs font-semibold transition-colors',
                selectedFilter === 'unread'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted hover:text-ink',
              ]"
              @click="selectedFilter = 'unread'"
            >
              Unread
            </button>
          </div>
        </header>

        <div v-if="filteredNotifications.length" class="divide-y divide-line">
          <button
            v-for="notification in filteredNotifications"
            :key="notification.id"
            type="button"
            :class="[
              'grid w-full gap-3 px-5 py-4 text-left transition-colors sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center',
              notification.isRead
                ? 'bg-surface hover:bg-surface-soft'
                : 'bg-brand-soft/35 hover:bg-brand-soft/55',
            ]"
            @click="openNotification(notification)"
          >
            <span
              :class="[
                'grid size-10 place-items-center',
                iconToneClasses[notification.type] ??
                  'bg-surface-soft text-muted',
              ]"
            >
              <AppIcon :name="notification.icon" :size="18" />
            </span>

            <span class="min-w-0">
              <span class="flex items-center gap-2">
                <strong class="truncate text-sm">
                  {{ notification.title }}
                </strong>
                <span
                  v-if="!notification.isRead"
                  class="size-1.5 shrink-0 rounded-full bg-danger"
                  aria-label="Unread"
                />
              </span>
              <span class="mt-1 block text-xs leading-5 text-muted">
                {{ notification.message }}
              </span>
            </span>

            <time class="text-[11px] text-subtle sm:text-right">
              {{ notification.dateLabel }}
            </time>
          </button>
        </div>

        <EmptyState
          v-else
          class="border-x-0 border-b-0"
          icon="bell"
          title="No notifications found"
          :description="
            selectedFilter === 'unread'
              ? 'You have read all current notifications.'
              : 'New updates will appear here.'
          "
        />
      </article>

      <aside class="border border-line bg-surface">
        <header class="border-b border-line px-5 py-4">
          <h3>Notification preferences</h3>
          <p class="mt-1 text-xs text-muted">Choose future in-app updates</p>
        </header>

        <div class="divide-y divide-line px-5">
          <label
            v-for="item in preferenceItems"
            :key="item.key"
            class="flex cursor-pointer items-start gap-3 py-4"
          >
            <input
              v-model="preferences[item.key]"
              type="checkbox"
              class="peer sr-only"
              @change="handlePreferenceChange"
            />
            <span
              class="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-badge border border-line-strong bg-surface text-transparent transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-brand/20"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 12 10"
                class="size-3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m1 5 3 3 7-7" />
              </svg>
            </span>
            <span>
              <strong class="block text-sm">{{ item.label }}</strong>
              <span class="mt-1 block text-xs leading-5 text-muted">
                {{ item.description }}
              </span>
            </span>
          </label>
        </div>

        <p
          v-if="preferenceMessage"
          class="border-t border-line bg-success-soft px-5 py-3 text-xs text-success"
          role="status"
        >
          {{ preferenceMessage }}
        </p>
      </aside>
    </section>
  </main>
</template>
