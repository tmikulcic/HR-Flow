<script setup>
import { computed, reactive, ref, watch } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppIcon from '../components/AppIcon.vue';
import AppInput from '../components/AppInput.vue';
import AppSelect from '../components/AppSelect.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusBadge from '../components/StatusBadge.vue';
import TimeEntryFormModal from '../components/TimeEntryFormModal.vue';
import { saveTimeEntry } from '../services/timeEntryManagementService.js';
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
const dataVersion = ref(0);
const entryModalOpen = ref(false);
const entryModalId = ref('');
const entryModalDate = ref('');
const entryModalEditing = ref(false);
const quickForm = reactive({
  date: '',
  startTime: '08:00',
  endTime: '16:00',
});
const quickErrors = reactive({});
const successMessage = ref('');

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

const weeklyRecords = computed(() => {
  void dataVersion.value;

  return getWeeklyTimeRecords(
    session.currentCompany.value?.id,
    selectedEmployeeId.value,
    weekStart.value,
  );
});

function clearQuickErrors() {
  Object.keys(quickErrors).forEach((key) => delete quickErrors[key]);
}

function resetQuickForm() {
  const firstMissingDay = weeklyRecords.value?.days.find(
    (day) => day.status === 'missing',
  );

  quickForm.date =
    firstMissingDay?.date ?? weeklyRecords.value?.weekStart ?? '';
  quickForm.startTime = '08:00';
  quickForm.endTime = '16:00';
  clearQuickErrors();
}

function changeWeek(offset) {
  weekStart.value = shiftWeek(weekStart.value, offset);
}

function openEntryModal(day = null) {
  const firstMissingDay = weeklyRecords.value?.days.find(
    (item) => item.status === 'missing',
  );
  const selectedDay = day ?? firstMissingDay;

  entryModalId.value = selectedDay?.entryId ?? '';
  entryModalDate.value = selectedDay?.date ?? '';
  entryModalEditing.value = selectedDay?.status === 'complete';
  entryModalOpen.value = true;
}

function handleQuickSubmit() {
  clearQuickErrors();
  successMessage.value = '';

  const matchingDay = weeklyRecords.value?.days.find(
    (day) => day.date === quickForm.date,
  );
  const result = saveTimeEntry(
    session.currentCompany.value?.id,
    selectedEmployeeId.value,
    matchingDay?.status === 'missing' ? (matchingDay.entryId ?? '') : '',
    quickForm,
  );

  if (!result.success) {
    Object.assign(quickErrors, result.errors);

    return;
  }

  dataVersion.value += 1;
  resetQuickForm();
  successMessage.value = 'Time entry saved.';
}

function handleEntrySaved() {
  entryModalOpen.value = false;
  dataVersion.value += 1;
  resetQuickForm();
  successMessage.value = entryModalEditing.value
    ? 'Time entry updated.'
    : 'Time entry saved.';
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

watch(
  () => [selectedEmployeeId.value, weekStart.value],
  () => {
    successMessage.value = '';
    resetQuickForm();
  },
  { immediate: true },
);
</script>

<template>
  <main class="mx-auto w-full min-w-0 max-w-[1480px]">
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

    <section
      v-if="weeklyRecords"
      class="mt-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4"
      aria-label="Weekly working time summary"
    >
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">Hours this week:</span>
        <span class="text-base font-semibold text-brand">
          {{ weeklyRecords.summary.totalLabel }}
        </span>
      </article>
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">Average day:</span>
        <span class="text-base font-semibold text-brand">
          {{ weeklyRecords.summary.averageLabel }}
        </span>
      </article>
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">Overtime:</span>
        <span class="text-base font-semibold text-brand">
          {{ weeklyRecords.summary.overtimeLabel }}
        </span>
      </article>
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">Completion:</span>
        <span class="text-base font-semibold text-brand">
          {{ weeklyRecords.summary.completionPercentage }}%
        </span>
      </article>
    </section>

    <div
      v-if="weeklyRecords?.summary.missingDays.length"
      class="mt-4 border border-warning bg-warning-soft px-5 py-3 text-sm text-warning"
      role="status"
    >
      <strong>
        {{ weeklyRecords.summary.missingDays.length }}
        {{
          weeklyRecords.summary.missingDays.length === 1
            ? 'weekday needs'
            : 'weekdays need'
        }}
        attention.
      </strong>
      Add working time for
      {{
        weeklyRecords.summary.missingDays.map((day) => day.label).join(', ')
      }}.
    </div>

    <div
      v-if="weeklyRecords"
      class="mt-6 grid min-w-0 max-w-full items-start gap-4"
    >
      <section
        class="min-w-0 max-w-full overflow-hidden border border-line bg-surface"
      >
        <header
          class="grid min-w-0 grid-cols-[40px_minmax(0,1fr)_40px] items-center border-b border-line px-3 py-4 sm:px-4"
        >
          <button
            type="button"
            class="grid size-9 place-items-center rounded-control border border-line-strong text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Previous week"
            @click="changeWeek(-1)"
          >
            <AppIcon name="chevron-left" :size="18" />
          </button>

          <div class="min-w-0 px-2 text-center sm:px-3">
            <h3 class="break-words">{{ weeklyRecords.weekLabel }}</h3>
            <p class="mt-1 break-words text-xs text-muted">
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

        <div class="divide-y divide-line lg:hidden">
          <article
            v-for="day in weeklyRecords.days"
            :key="day.date"
            :class="[
              'min-w-0 px-4 py-4',
              day.status === 'missing' ? 'bg-surface-soft/45' : '',
            ]"
          >
            <div class="flex min-w-0 items-start justify-between gap-3">
              <strong class="min-w-0 break-words text-sm">
                {{ day.dateLabel }}
              </strong>
              <StatusBadge :tone="day.statusTone" class="shrink-0">
                {{ day.statusLabel }}
              </StatusBadge>
            </div>

            <dl class="mt-4 grid grid-cols-3 gap-x-5 gap-y-3 text-xs">
              <div class="min-w-0">
                <dt class="text-muted">Start</dt>
                <dd class="mt-1 font-semibold text-ink">
                  {{ day.startTime }}
                </dd>
              </div>
              <div class="min-w-0">
                <dt class="text-muted">End</dt>
                <dd class="mt-1 font-semibold text-ink">
                  {{ day.endTime }}
                </dd>
              </div>
              <div class="min-w-0">
                <dt class="text-muted">Total</dt>
                <dd class="mt-1 font-semibold text-ink">
                  {{ day.totalLabel }}
                </dd>
              </div>
            </dl>

            <AppButton
              variant="secondary"
              size="small"
              class="mt-4 w-full"
              @click="openEntryModal(day)"
            >
              {{ day.status === 'complete' ? 'Edit entry' : 'Add entry' }}
            </AppButton>
          </article>
        </div>

        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[680px] border-collapse text-left">
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
                  Total
                </th>
                <th
                  scope="col"
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                >
                  Status
                </th>
                <th scope="col" class="px-5 py-3">
                  <span class="sr-only">Actions</span>
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
                <td class="px-5 py-4 text-sm font-semibold">
                  {{ day.totalLabel }}
                </td>
                <td class="px-5 py-4">
                  <StatusBadge :tone="day.statusTone">
                    {{ day.statusLabel }}
                  </StatusBadge>
                </td>
                <td class="px-5 py-4 text-right">
                  <AppButton
                    variant="secondary"
                    size="small"
                    @click="openEntryModal(day)"
                  >
                    {{ day.status === 'complete' ? 'Edit' : 'Add' }}
                  </AppButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside
        class="min-w-0 max-w-full overflow-hidden border border-line bg-surface"
      >
        <header class="border-b border-line bg-surface-soft px-5 py-4">
          <p
            class="text-[11px] font-bold uppercase tracking-[0.1em] text-brand"
          >
            Quick entry
          </p>
          <h3 class="mt-1">Record working time</h3>
        </header>

        <form
          class="grid min-w-0 gap-4 px-4 py-5 sm:px-5"
          @submit.prevent="handleQuickSubmit"
        >
          <p
            v-if="quickErrors.form"
            class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
            role="alert"
          >
            {{ quickErrors.form }}
          </p>
          <p
            v-if="successMessage"
            class="border-l-2 border-success bg-success-soft px-3 py-2 text-xs text-success"
            role="status"
          >
            {{ successMessage }}
          </p>

          <AppInput
            v-model="quickForm.date"
            label="Work date"
            type="date"
            :error="quickErrors.date"
            required
          />
          <div class="grid min-w-0 gap-3 sm:grid-cols-2">
            <AppInput
              v-model="quickForm.startTime"
              label="Start"
              type="time"
              :error="quickErrors.startTime"
              required
            />
            <AppInput
              v-model="quickForm.endTime"
              label="End"
              type="time"
              :error="quickErrors.endTime"
              required
            />
          </div>
          <AppButton type="submit" class="w-full">Save quick entry</AppButton>
          <AppButton
            variant="secondary"
            class="w-full"
            @click="openEntryModal()"
          >
            Open detailed entry
          </AppButton>
        </form>
      </aside>
    </div>

    <EmptyState
      v-else
      class="mt-6"
      icon="clock"
      title="No employee selected"
      description="Select an employee to review weekly time records."
    />

    <TimeEntryFormModal
      :open="entryModalOpen"
      :company-id="session.currentCompany.value?.id ?? ''"
      :employee-id="selectedEmployeeId"
      :entry-id="entryModalId"
      :initial-date="entryModalDate"
      :editing="entryModalEditing"
      @close="entryModalOpen = false"
      @saved="handleEntrySaved"
    />
  </main>
</template>
