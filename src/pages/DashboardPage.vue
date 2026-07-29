<script setup>
import { computed } from 'vue';
import AppIcon from '../components/AppIcon.vue';
import Avatar from '../components/Avatar.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { getDashboardData } from '../services/dashboardService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();

const dashboard = computed(() =>
  getDashboardData(
    session.currentUser.value,
    session.currentEmployee.value,
    session.currentCompany.value,
  ),
);

const employeeFirstName = computed(
  () => session.currentEmployee.value?.firstName ?? 'there',
);

const currentDate = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date());

const activityIcons = {
  leave: 'calendar',
  time: 'clock',
  employee: 'employees',
};

const activityTones = {
  Pending: 'warning',
  Approved: 'success',
  Declined: 'danger',
  Withdrawn: 'neutral',
};

const kpiBorderClasses = [
  '',
  'border-t border-line sm:border-l sm:border-t-0',
  'border-t border-line xl:border-l xl:border-t-0',
  'border-t border-line sm:border-l xl:border-t-0',
];
</script>

<template>
  <main v-if="dashboard" class="mx-auto w-full max-w-[1480px]">
    <section
      class="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
        >
          {{ dashboard.eyebrow }}
        </p>
        <h2>{{ dashboard.title }}</h2>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Good morning, {{ employeeFirstName }}. {{ dashboard.description }}
        </p>
        <p class="mt-1 text-xs text-subtle">{{ currentDate }}</p>
      </div>

      <RouterLink
        to="/leave-requests/new"
        class="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-control border border-brand bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:self-auto"
      >
        <AppIcon name="calendar" :size="16" />
        Request leave
      </RouterLink>
    </section>

    <section
      class="mt-6 grid border border-line bg-surface sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Dashboard statistics"
    >
      <article
        v-for="(kpi, index) in dashboard.kpis"
        :key="kpi.label"
        :class="['min-h-28 p-5', kpiBorderClasses[index]]"
      >
        <p class="text-xs font-semibold text-muted">{{ kpi.label }}</p>
        <p class="mt-3 text-2xl font-bold tracking-[-0.025em] text-ink">
          {{ kpi.value }}
        </p>
      </article>
    </section>

    <section
      class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]"
    >
      <article class="border border-line bg-surface">
        <header
          class="flex items-center justify-between gap-4 border-b border-line px-5 py-4"
        >
          <div>
            <h3>Weekly attendance</h3>
            <p class="mt-1 text-xs text-muted">
              Completed time entries · {{ dashboard.weekLabel }}
            </p>
          </div>
          <RouterLink
            to="/time-tracking"
            class="text-xs font-semibold text-brand hover:text-brand-dark"
          >
            View time records
          </RouterLink>
        </header>

        <div class="divide-y divide-line px-5">
          <div
            v-for="day in dashboard.weeklyAttendance"
            :key="day.date"
            class="grid grid-cols-[64px_minmax(0,1fr)_74px] items-center gap-4 py-4"
          >
            <div>
              <strong class="block text-xs">{{ day.day }}</strong>
              <span class="text-xs text-subtle">{{ day.dayNumber }}</span>
            </div>
            <div class="h-2 bg-surface-soft">
              <div
                class="h-full bg-brand"
                :style="{ width: `${day.percentage}%` }"
              />
            </div>
            <div class="text-right">
              <strong class="block text-xs">{{ day.formattedTime }}</strong>
              <span class="text-[11px] text-subtle">
                {{ day.people }} {{ day.people === 1 ? 'person' : 'people' }}
              </span>
            </div>
          </div>
        </div>
      </article>

      <article class="border border-line bg-surface">
        <header class="border-b border-line px-5 py-4">
          <h3>Team availability</h3>
          <p class="mt-1 text-xs text-muted">Current availability by team</p>
        </header>

        <div
          v-if="dashboard.teamAvailability.length"
          class="divide-y divide-line px-5"
        >
          <div
            v-for="team in dashboard.teamAvailability"
            :key="team.id"
            class="py-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <strong class="text-sm">{{ team.name }}</strong>
                <p class="mt-1 text-xs text-muted">
                  {{ team.available }} of {{ team.total }} available
                </p>
              </div>
              <strong class="text-sm text-brand">{{ team.percentage }}%</strong>
            </div>
            <div class="mt-3 h-1.5 bg-surface-soft">
              <div
                class="h-full bg-brand"
                :style="{ width: `${team.percentage}%` }"
              />
            </div>
            <p
              v-if="team.pendingRequests"
              class="mt-2 text-[11px] text-warning"
            >
              {{ team.pendingRequests }} pending
              {{ team.pendingRequests === 1 ? 'request' : 'requests' }}
            </p>
          </div>
        </div>

        <p v-else class="px-5 py-8 text-sm text-muted">
          No team data is available for this account.
        </p>
      </article>
    </section>

    <section class="mt-6 border border-line bg-surface">
      <header
        class="flex items-center justify-between gap-4 border-b border-line px-5 py-4"
      >
        <div>
          <h3>Recent activity</h3>
          <p class="mt-1 text-xs text-muted">
            Latest updates within your access scope
          </p>
        </div>
        <RouterLink
          to="/notifications"
          class="text-xs font-semibold text-brand hover:text-brand-dark"
        >
          View notifications
        </RouterLink>
      </header>

      <div v-if="dashboard.recentActivity.length" class="divide-y divide-line">
        <article
          v-for="activity in dashboard.recentActivity"
          :key="activity.id"
          class="grid gap-3 px-5 py-4 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center"
        >
          <Avatar
            v-if="activity.type === 'employee'"
            :name="activity.title"
            size="small"
            tone="success"
          />
          <span
            v-else
            class="grid size-9 place-items-center rounded-control bg-brand-soft text-brand-dark"
          >
            <AppIcon :name="activityIcons[activity.type]" :size="17" />
          </span>

          <div class="min-w-0">
            <strong class="block truncate text-sm">{{ activity.title }}</strong>
            <p class="mt-1 text-xs text-muted">{{ activity.description }}</p>
          </div>

          <div class="flex items-center gap-3 sm:justify-end">
            <StatusBadge
              v-if="activity.status"
              :tone="activityTones[activity.status]"
            >
              {{ activity.status }}
            </StatusBadge>
            <time class="text-[11px] text-subtle">
              {{ activity.dateLabel }}
            </time>
          </div>
        </article>
      </div>

      <p v-else class="px-5 py-8 text-sm text-muted">
        No recent activity is available.
      </p>
    </section>
  </main>
</template>
