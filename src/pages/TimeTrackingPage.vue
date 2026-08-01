<script setup>
import { computed, ref, watch } from 'vue';
import AppIcon from '../components/AppIcon.vue';
import AppSelect from '../components/AppSelect.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusBadge from '../components/StatusBadge.vue';
import {
  canReviewCompanyTime,
  getDefaultWeekStart,
  getTimeTrackingEmployeeOptions,
  getWeeklyTimeRecords,
  shiftWeek,
} from '../services/timeTrackingService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const selectedEmployeeId = ref(session.currentEmployee.value?.id ?? '');
const weekStart = ref('');

const canSelectEmployee = computed(() =>
  canReviewCompanyTime(session.currentUser.value),
);

const employeeOptions = computed(() =>
  getTimeTrackingEmployeeOptions(
    session.currentCompany.value?.id,
    session.currentUser.value,
    session.currentEmployee.value,
  ),
);

const selectOptions = computed(() =>
  employeeOptions.value.map(({ value, label }) => ({ value, label })),
);

const selectedEmployee = computed(() =>
  employeeOptions.value.find(
    (employee) => employee.value === selectedEmployeeId.value,
  ),
);

const weeklyRecords = computed(() =>
  getWeeklyTimeRecords(
    session.currentCompany.value?.id,
    selectedEmployeeId.value,
    weekStart.value,
  ),
);

function changeWeek(offset) {
  weekStart.value = shiftWeek(weekStart.value, offset);
}

watch(
  selectedEmployeeId,
  (employeeId) => {
    if (employeeId) {
      weekStart.value = getDefaultWeekStart(
        session.currentCompany.value?.id,
        employeeId,
      );
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="mx-auto w-full max-w-[1480px]">
    <section
      class="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <p
          class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
        >
          Working time
        </p>
        <h2>Weekly time records</h2>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Review recorded working time for each weekday and move between
          previous or upcoming weeks.
        </p>
      </div>

      <div v-if="canSelectEmployee" class="w-full max-w-xs">
        <AppSelect
          v-model="selectedEmployeeId"
          label="Employee"
          :options="selectOptions"
        />
      </div>
      <div v-else-if="selectedEmployee" class="text-left lg:text-right">
        <strong class="block text-sm">{{ selectedEmployee.label }}</strong>
        <span class="text-xs text-muted">
          {{ selectedEmployee.jobTitle }} · {{ selectedEmployee.teamName }}
        </span>
      </div>
    </section>

    <section v-if="weeklyRecords" class="mt-6 border border-line bg-surface">
      <header
        class="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center border-b border-line px-4 py-4"
      >
        <button
          type="button"
          class="grid size-9 place-items-center rounded-control border border-line-strong text-muted hover:bg-surface-soft hover:text-ink"
          aria-label="Previous week"
          @click="changeWeek(-1)"
        >
          <AppIcon name="chevron-left" :size="18" />
        </button>

        <div class="px-3 text-center">
          <h3>{{ weeklyRecords.weekLabel }}</h3>
          <p class="mt-1 text-xs text-muted">
            {{ weeklyRecords.employee.fullName }} ·
            {{ weeklyRecords.employee.jobTitle }}
          </p>
        </div>

        <button
          type="button"
          class="grid size-9 place-items-center rounded-control border border-line-strong text-muted hover:bg-surface-soft hover:text-ink"
          aria-label="Next week"
          @click="changeWeek(1)"
        >
          <AppIcon name="chevron-right" :size="18" />
        </button>
      </header>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] border-collapse text-left">
          <caption class="sr-only">
            Weekly working time records
          </caption>
          <thead class="border-b border-line bg-surface-soft">
            <tr>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Date
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Start
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                End
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Break
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Total
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
            <tr
              v-for="day in weeklyRecords.days"
              :key="day.date"
              :class="day.status === 'missing' ? 'bg-surface-soft/45' : ''"
            >
              <td class="px-5 py-4 text-sm font-semibold">
                {{ day.dateLabel }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ day.startTime }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ day.endTime }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ day.breakLabel }}
              </td>
              <td class="px-5 py-4 text-sm font-semibold">
                {{ day.totalLabel }}
              </td>
              <td class="px-5 py-4">
                <StatusBadge :tone="day.statusTone">
                  {{ day.statusLabel }}
                </StatusBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <EmptyState
      v-else
      class="mt-6"
      icon="clock"
      title="No employee selected"
      description="Select an employee to review weekly time records."
    />
  </main>
</template>
