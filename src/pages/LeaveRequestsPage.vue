<script setup>
import { computed, ref } from 'vue';
import AppIcon from '../components/AppIcon.vue';
import AppSelect from '../components/AppSelect.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { LEAVE_REQUEST_STATUSES } from '../domain/index.js';
import { getEmployeeLeaveOverview } from '../services/leaveOverviewService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const selectedStatus = ref('all');

const leaveOverview = computed(() =>
  getEmployeeLeaveOverview(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
  ),
);

const statusOptions = computed(() => {
  const overview = leaveOverview.value;

  if (!overview) {
    return [];
  }

  return [
    { value: 'all', label: `All requests (${overview.requests.length})` },
    {
      value: LEAVE_REQUEST_STATUSES.PENDING,
      label: `Pending (${overview.statusCounts.pending})`,
    },
    {
      value: LEAVE_REQUEST_STATUSES.APPROVED,
      label: `Approved (${overview.statusCounts.approved})`,
    },
    {
      value: LEAVE_REQUEST_STATUSES.DECLINED,
      label: `Declined (${overview.statusCounts.declined})`,
    },
    {
      value: LEAVE_REQUEST_STATUSES.WITHDRAWN,
      label: `Withdrawn (${overview.statusCounts.withdrawn})`,
    },
  ];
});

const filteredRequests = computed(() => {
  if (!leaveOverview.value) {
    return [];
  }

  if (selectedStatus.value === 'all') {
    return leaveOverview.value.requests;
  }

  return leaveOverview.value.requests.filter(
    (request) => request.status === selectedStatus.value,
  );
});
</script>

<template>
  <main v-if="leaveOverview" class="mx-auto w-full max-w-[1480px]">
    <section
      class="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
        >
          Time off
        </p>
        <h2>My leave</h2>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Review your annual leave balance, request history and upcoming time
          away.
        </p>
      </div>

      <RouterLink
        :to="{ name: 'new-leave-request' }"
        class="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-control border border-brand bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:self-auto"
      >
        <AppIcon name="calendar" :size="16" />
        Request leave
      </RouterLink>
    </section>

    <section
      class="mt-6 grid grid-cols-2 border border-line bg-surface lg:grid-cols-4"
      aria-label="Annual leave balance"
    >
      <article class="border-b border-r border-line px-5 py-4 lg:border-b-0">
        <p class="text-xs font-semibold text-muted">Annual allowance</p>
        <strong class="mt-2 block text-xl tabular-nums">
          {{ leaveOverview.balance.allowance }} days
        </strong>
      </article>
      <article class="border-b border-line px-5 py-4 lg:border-b-0 lg:border-r">
        <p class="text-xs font-semibold text-muted">Remaining</p>
        <strong class="mt-2 block text-xl tabular-nums">
          {{ leaveOverview.balance.remainingDays }} days
        </strong>
      </article>
      <article class="border-r border-line px-5 py-4">
        <p class="text-xs font-semibold text-muted">Used</p>
        <strong class="mt-2 block text-xl tabular-nums">
          {{ leaveOverview.balance.usedDays }} days
        </strong>
      </article>
      <article class="px-5 py-4">
        <p class="text-xs font-semibold text-muted">Pending approval</p>
        <strong class="mt-2 block text-xl tabular-nums">
          {{ leaveOverview.balance.pendingDays }} days
        </strong>
      </article>
    </section>

    <section
      class="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
    >
      <article class="border border-line bg-surface">
        <header
          class="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h3>Request history</h3>
            <p class="mt-1 text-xs text-muted">
              Submitted leave requests and their current status
            </p>
          </div>
          <AppSelect
            v-model="selectedStatus"
            class="w-full sm:w-48"
            label="Status"
            :options="statusOptions"
          />
        </header>

        <div v-if="filteredRequests.length" class="overflow-x-auto">
          <table class="w-full min-w-[820px] border-collapse text-left">
            <caption class="sr-only">
              Leave request history
            </caption>
            <thead class="border-b border-line bg-surface-soft">
              <tr>
                <th
                  scope="col"
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                >
                  Leave type
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                >
                  Dates
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                >
                  Duration
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                >
                  Submitted
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="request in filteredRequests" :key="request.id">
                <td class="px-5 py-4">
                  <strong class="block text-sm">{{ request.typeLabel }}</strong>
                  <span class="mt-1 block max-w-52 truncate text-xs text-muted">
                    {{ request.reason }}
                  </span>
                </td>
                <td class="px-5 py-4 text-sm text-muted">
                  {{ request.dateRangeLabel }}
                </td>
                <td class="px-5 py-4 text-sm font-semibold">
                  {{ request.durationLabel }}
                </td>
                <td class="px-5 py-4 text-sm text-muted">
                  {{ request.submittedLabel }}
                </td>
                <td class="px-5 py-4">
                  <StatusBadge :tone="request.statusTone">
                    {{ request.statusLabel }}
                  </StatusBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="grid justify-items-center px-6 py-12 text-center">
          <span
            class="mb-4 grid size-10 place-items-center bg-brand-soft text-brand"
          >
            <AppIcon name="calendar" :size="19" />
          </span>
          <h3>No matching requests</h3>
          <p class="mt-1 max-w-md text-sm text-muted">
            No leave requests match the selected status.
          </p>
        </div>
      </article>

      <aside class="grid content-start gap-6">
        <article class="border border-line bg-surface">
          <header class="border-b border-line px-5 py-4">
            <h3>Annual leave usage</h3>
            <p class="mt-1 text-xs text-muted">
              Approved annual leave for the current year
            </p>
          </header>
          <div class="px-5 py-5">
            <div class="flex items-end justify-between gap-4">
              <span class="text-xs font-semibold text-muted">Used balance</span>
              <strong class="text-sm tabular-nums">
                {{ leaveOverview.balance.usedDays }} /
                {{ leaveOverview.balance.allowance }} days
              </strong>
            </div>
            <div class="mt-3 h-2 bg-surface-soft" aria-hidden="true">
              <div
                class="h-full bg-brand"
                :style="{
                  width: `${leaveOverview.balance.usedPercentage}%`,
                }"
              />
            </div>
            <p class="mt-4 text-xs leading-5 text-muted">
              Pending requests are shown separately and affect the balance only
              after approval.
            </p>
          </div>
        </article>

        <article class="border border-line bg-surface">
          <header class="border-b border-line px-5 py-4">
            <h3>Upcoming leave</h3>
            <p class="mt-1 text-xs text-muted">Approved time away</p>
          </header>

          <div
            v-if="leaveOverview.upcomingLeave.length"
            class="divide-y divide-line px-5"
          >
            <div
              v-for="request in leaveOverview.upcomingLeave"
              :key="request.id"
              class="py-4"
            >
              <div class="flex items-start justify-between gap-3">
                <strong class="text-sm">{{ request.typeLabel }}</strong>
                <span class="text-xs font-semibold text-brand">
                  {{ request.durationLabel }}
                </span>
              </div>
              <p class="mt-1 text-xs text-muted">
                {{ request.dateRangeLabel }}
              </p>
            </div>
          </div>
          <p v-else class="px-5 py-8 text-sm text-muted">
            No approved leave is currently scheduled.
          </p>
        </article>
      </aside>
    </section>
  </main>
</template>
