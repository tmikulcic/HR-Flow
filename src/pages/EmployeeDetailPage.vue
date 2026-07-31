<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import Avatar from '../components/Avatar.vue';
import EmployeeFormModal from '../components/EmployeeFormModal.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { hasPermission, PERMISSIONS } from '../domain/index.js';
import { getEmployeeProfile } from '../services/employeeProfileService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const route = useRoute();
const session = useSessionStore();
const activeTab = ref('overview');
const employeeFormOpen = ref(false);
const dataVersion = ref(0);

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'time', label: 'Time records' },
  { id: 'leave', label: 'Leave history' },
];

const profile = computed(() => {
  dataVersion.value;

  return getEmployeeProfile(
    session.currentCompany.value?.id,
    route.params.employeeId,
  );
});

const canManageEmployees = computed(() =>
  hasPermission(session.currentRole.value, PERMISSIONS.MANAGE_EMPLOYEES),
);

const activityIcons = {
  time: 'clock',
  leave: 'calendar',
};

function handleEmployeeSaved() {
  employeeFormOpen.value = false;
  dataVersion.value += 1;
  session.initializeSession();
}
</script>

<template>
  <main class="mx-auto w-full max-w-[1480px]">
    <template v-if="profile">
      <nav class="mb-5 text-xs text-muted" aria-label="Breadcrumb">
        <RouterLink
          to="/employees"
          class="font-semibold text-brand hover:text-brand-dark"
        >
          Employees
        </RouterLink>
        <span class="mx-2 text-subtle">/</span>
        <span>{{ profile.employee.fullName }}</span>
      </nav>

      <section
        class="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center"
      >
        <Avatar :name="profile.employee.fullName" size="large" />
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-3">
            <h2>{{ profile.employee.fullName }}</h2>
            <StatusBadge :tone="profile.employee.statusTone">
              {{ profile.employee.statusLabel }}
            </StatusBadge>
          </div>
          <p class="mt-2 text-sm text-muted">
            {{ profile.employee.jobTitle }} · {{ profile.employee.teamName }}
          </p>
          <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-subtle">
            <span>{{ profile.employee.email }}</span>
            <span>{{ profile.employee.location }}</span>
            <span>{{ profile.employee.employmentTypeLabel }}</span>
          </div>
        </div>
        <button
          v-if="canManageEmployees"
          type="button"
          class="inline-flex min-h-9 items-center justify-center rounded-control border border-brand bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark sm:ml-auto"
          @click="employeeFormOpen = true"
        >
          Edit employee
        </button>
      </section>

      <nav class="mt-6 flex border-b border-line" aria-label="Profile sections">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            '-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
            activeTab === tab.id
              ? 'border-brand text-brand'
              : 'border-transparent text-muted hover:text-ink',
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <section
        v-if="activeTab === 'overview'"
        class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]"
      >
        <div class="grid content-start gap-6">
          <article class="border border-line bg-surface">
            <header class="border-b border-line px-5 py-4">
              <h3>Personal information</h3>
              <p class="mt-1 text-xs text-muted">
                Contact and employment details
              </p>
            </header>
            <dl class="grid sm:grid-cols-2">
              <div class="border-b border-line px-5 py-4 sm:border-r">
                <dt class="text-xs text-muted">Work email</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ profile.employee.email }}
                </dd>
              </div>
              <div class="border-b border-line px-5 py-4">
                <dt class="text-xs text-muted">Phone</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ profile.employee.phone || '—' }}
                </dd>
              </div>
              <div class="border-b border-line px-5 py-4 sm:border-r">
                <dt class="text-xs text-muted">Start date</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ profile.employee.startDateLabel }}
                </dd>
              </div>
              <div class="border-b border-line px-5 py-4">
                <dt class="text-xs text-muted">Employment</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ profile.employee.employmentTypeLabel }}
                </dd>
              </div>
              <div class="px-5 py-4 sm:border-r">
                <dt class="text-xs text-muted">Location</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ profile.employee.location }}
                </dd>
              </div>
              <div class="px-5 py-4">
                <dt class="text-xs text-muted">Employee ID</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ profile.employee.id }}
                </dd>
              </div>
            </dl>
          </article>

          <article class="border border-line bg-surface">
            <header class="border-b border-line px-5 py-4">
              <h3>Leave balance</h3>
              <p class="mt-1 text-xs text-muted">
                Annual allowance and approved usage
              </p>
            </header>
            <div class="p-5">
              <div
                class="grid gap-5 sm:grid-cols-[minmax(0,1fr)_repeat(3,110px)] sm:items-end"
              >
                <div>
                  <p class="text-xs font-semibold text-muted">
                    Annual leave usage
                  </p>
                  <div class="mt-3 h-2 bg-surface-soft">
                    <div
                      class="h-full bg-brand"
                      :style="{
                        width: `${profile.leaveBalance.usedPercentage}%`,
                      }"
                    />
                  </div>
                </div>
                <div>
                  <strong class="block text-xl">
                    {{ profile.leaveBalance.remainingDays }}
                  </strong>
                  <span class="text-xs text-muted">Remaining</span>
                </div>
                <div>
                  <strong class="block text-xl">
                    {{ profile.leaveBalance.usedDays }}
                  </strong>
                  <span class="text-xs text-muted">Used</span>
                </div>
                <div>
                  <strong class="block text-xl">
                    {{ profile.leaveBalance.pendingDays }}
                  </strong>
                  <span class="text-xs text-muted">Pending</span>
                </div>
              </div>
              <p
                class="mt-5 border-l-2 border-line-strong pl-3 text-xs text-muted"
              >
                {{ profile.leaveBalance.nextApprovedLeave }}
              </p>
            </div>
          </article>
        </div>

        <aside class="grid content-start gap-6">
          <article class="border border-line bg-surface">
            <header class="border-b border-line px-5 py-4">
              <h3>Organization</h3>
              <p class="mt-1 text-xs text-muted">Role and reporting line</p>
            </header>
            <dl class="divide-y divide-line px-5">
              <div class="flex justify-between gap-4 py-4">
                <dt class="text-xs text-muted">Team</dt>
                <dd class="text-right text-sm font-semibold">
                  {{ profile.organization.teamName }}
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-4">
                <dt class="text-xs text-muted">Manager</dt>
                <dd class="text-right text-sm font-semibold">
                  {{ profile.organization.managerName }}
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-4">
                <dt class="text-xs text-muted">System role</dt>
                <dd class="text-right text-sm font-semibold">
                  {{ profile.organization.roleLabel }}
                </dd>
              </div>
              <div class="py-4">
                <dt class="text-xs text-muted">Direct reports</dt>
                <dd
                  v-if="profile.organization.directReports.length"
                  class="mt-3 grid gap-2"
                >
                  <RouterLink
                    v-for="employee in profile.organization.directReports"
                    :key="employee.id"
                    :to="{
                      name: 'employee-detail',
                      params: { employeeId: employee.id },
                    }"
                    class="flex items-center justify-between gap-3 text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    <span>{{ employee.fullName }}</span>
                    <span aria-hidden="true">→</span>
                  </RouterLink>
                </dd>
                <dd v-else class="mt-1 text-sm font-semibold">
                  No direct reports
                </dd>
              </div>
            </dl>
          </article>

          <article class="border border-line bg-surface">
            <header class="border-b border-line px-5 py-4">
              <h3>Recent activity</h3>
            </header>
            <div
              v-if="profile.recentActivity.length"
              class="divide-y divide-line px-5"
            >
              <div
                v-for="activity in profile.recentActivity"
                :key="activity.id"
                class="flex gap-3 py-4"
              >
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-control bg-brand-soft text-brand"
                >
                  <AppIcon :name="activityIcons[activity.type]" :size="15" />
                </span>
                <div class="min-w-0">
                  <strong class="block text-xs">{{ activity.title }}</strong>
                  <p class="mt-1 text-xs text-muted">
                    {{ activity.description }}
                  </p>
                  <StatusBadge :tone="activity.statusTone" class="mt-2">
                    {{ activity.statusLabel }}
                  </StatusBadge>
                </div>
              </div>
            </div>
            <p v-else class="px-5 py-8 text-sm text-muted">
              No activity recorded.
            </p>
          </article>
        </aside>
      </section>

      <section
        v-else-if="activeTab === 'time'"
        class="mt-6 overflow-x-auto border border-line bg-surface"
      >
        <table
          v-if="profile.timeRecords.length"
          class="w-full min-w-[760px] border-collapse text-left"
        >
          <thead class="border-b border-line bg-surface-soft">
            <tr>
              <th class="px-5 py-3 text-xs text-muted">Date</th>
              <th class="px-5 py-3 text-xs text-muted">Working time</th>
              <th class="px-5 py-3 text-xs text-muted">Break</th>
              <th class="px-5 py-3 text-xs text-muted">Total</th>
              <th class="px-5 py-3 text-xs text-muted">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="entry in profile.timeRecords" :key="entry.id">
              <td class="px-5 py-4 text-sm font-semibold">
                {{ entry.dateLabel }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ entry.timeRange }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ entry.breakLabel }}
              </td>
              <td class="px-5 py-4 text-sm font-semibold">
                {{ entry.totalLabel }}
              </td>
              <td class="px-5 py-4">
                <StatusBadge :tone="entry.statusTone">
                  {{ entry.statusLabel }}
                </StatusBadge>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="px-5 py-12 text-center text-sm text-muted">
          No time records available.
        </p>
      </section>

      <section
        v-else
        class="mt-6 overflow-x-auto border border-line bg-surface"
      >
        <table
          v-if="profile.leaveHistory.length"
          class="w-full min-w-[820px] border-collapse text-left"
        >
          <thead class="border-b border-line bg-surface-soft">
            <tr>
              <th class="px-5 py-3 text-xs text-muted">Type</th>
              <th class="px-5 py-3 text-xs text-muted">Dates</th>
              <th class="px-5 py-3 text-xs text-muted">Days</th>
              <th class="px-5 py-3 text-xs text-muted">Submitted</th>
              <th class="px-5 py-3 text-xs text-muted">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="request in profile.leaveHistory" :key="request.id">
              <td class="px-5 py-4 text-sm font-semibold">
                {{ request.typeLabel }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ request.dateRangeLabel }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ request.workingDays }}
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
        <p v-else class="px-5 py-12 text-center text-sm text-muted">
          No leave requests available.
        </p>
      </section>
    </template>

    <EmptyState
      v-else
      icon="employees"
      title="Employee not found"
      description="The employee does not exist or is not part of your company."
    >
      <template #action>
        <RouterLink
          to="/employees"
          class="inline-flex rounded-control border border-brand bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Back to employees
        </RouterLink>
      </template>
    </EmptyState>

    <EmployeeFormModal
      v-if="profile"
      :open="employeeFormOpen"
      :company-id="session.currentCompany.value?.id ?? ''"
      :employee-id="profile.employee.id"
      @close="employeeFormOpen = false"
      @saved="handleEmployeeSaved"
    />
  </main>
</template>
