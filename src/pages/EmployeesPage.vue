<script setup>
import { computed, ref } from 'vue';
import AppIcon from '../components/AppIcon.vue';
import AppSelect from '../components/AppSelect.vue';
import Avatar from '../components/Avatar.vue';
import EmployeeFormModal from '../components/EmployeeFormModal.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { hasPermission, PERMISSIONS } from '../domain/index.js';
import {
  filterEmployeeDirectory,
  getEmployeeDirectory,
  getEmployeeFilterOptions,
} from '../services/employeeService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const searchTerm = ref('');
const selectedTeam = ref('');
const selectedStatus = ref('');
const employeeFormOpen = ref(false);
const dataVersion = ref(0);

const employees = computed(() => {
  dataVersion.value;

  return getEmployeeDirectory(session.currentCompany.value?.id);
});

const filterOptions = computed(() => getEmployeeFilterOptions(employees.value));

const filteredEmployees = computed(() =>
  filterEmployeeDirectory(employees.value, {
    search: searchTerm.value,
    teamId: selectedTeam.value,
    status: selectedStatus.value,
  }),
);

const teamCount = computed(
  () => new Set(employees.value.map((employee) => employee.teamId)).size,
);

const hasActiveFilters = computed(
  () =>
    Boolean(searchTerm.value.trim()) ||
    Boolean(selectedTeam.value) ||
    Boolean(selectedStatus.value),
);

const emptyStateCopy = computed(() =>
  employees.value.length
    ? {
        title: 'No matching employees',
        description:
          'Try another search term or clear one of the selected filters.',
      }
    : {
        title: 'No employees found',
        description: 'This company does not have any employee records yet.',
      },
);

const canManageEmployees = computed(() =>
  hasPermission(session.currentRole.value, PERMISSIONS.MANAGE_EMPLOYEES),
);

function clearFilters() {
  searchTerm.value = '';
  selectedTeam.value = '';
  selectedStatus.value = '';
}

function handleEmployeeSaved() {
  employeeFormOpen.value = false;
  dataVersion.value += 1;
  session.initializeSession();
  clearFilters();
}
</script>

<template>
  <main class="mx-auto min-w-0 w-full max-w-[1480px]">
    <section
      class="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
        >
          People directory
        </p>
        <h2>Employees</h2>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Review employee information and organizational assignments for
          {{ session.currentCompany.value?.name }}.
        </p>
      </div>

      <div class="flex flex-wrap items-end gap-6">
        <div class="flex gap-6 text-right">
          <div>
            <strong class="block text-lg">{{ employees.length }}</strong>
            <span class="text-xs text-muted">Employees</span>
          </div>
          <div>
            <strong class="block text-lg">{{ teamCount }}</strong>
            <span class="text-xs text-muted">Teams</span>
          </div>
        </div>
        <button
          v-if="canManageEmployees"
          type="button"
          class="inline-flex min-h-9 items-center justify-center rounded-control border border-brand bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          @click="employeeFormOpen = true"
        >
          Add employee
        </button>
      </div>
    </section>

    <section class="mt-6">
      <div
        class="min-w-0 max-w-full overflow-hidden border border-line bg-surface"
      >
        <div
          class="grid gap-4 border-b border-line p-4 lg:grid-cols-[minmax(260px,1fr)_180px_180px]"
        >
          <label class="relative block">
            <span class="sr-only">Search employees</span>
            <AppIcon
              name="search"
              :size="17"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              v-model="searchTerm"
              type="search"
              class="w-full pl-10"
              placeholder="Search by name or email"
              autocomplete="off"
            />
          </label>

          <AppSelect
            v-model="selectedTeam"
            :options="filterOptions.teams"
            aria-label="Filter by team"
          />

          <AppSelect
            v-model="selectedStatus"
            :options="filterOptions.statuses"
            aria-label="Filter by status"
          />
        </div>

        <div
          class="flex min-h-11 items-center justify-between gap-4 px-5 py-2 text-xs text-muted"
        >
          <span>
            Showing {{ filteredEmployees.length }} of
            {{ employees.length }} employees
          </span>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="font-semibold text-brand hover:text-brand-dark"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div
        v-if="filteredEmployees.length"
        class="border-x border-b border-line bg-surface md:hidden"
      >
        <article
          v-for="employee in filteredEmployees"
          :key="employee.id"
          class="min-w-0 border-t border-line px-4 py-4 first:border-t-0"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <RouterLink
              :to="{
                name: 'employee-detail',
                params: { employeeId: employee.id },
              }"
              class="flex min-w-0 items-center gap-3"
            >
              <Avatar
                :name="employee.fullName"
                size="small"
                class="shrink-0"
              />
              <span class="min-w-0">
                <strong class="block truncate text-sm">
                  {{ employee.fullName }}
                </strong>
                <span class="mt-0.5 block break-all text-xs text-muted">
                  {{ employee.email }}
                </span>
              </span>
            </RouterLink>
            <StatusBadge :tone="employee.statusTone" class="shrink-0">
              {{ employee.statusLabel }}
            </StatusBadge>
          </div>

          <dl class="mt-4 grid min-w-0 gap-2 text-xs">
            <div
              class="grid min-w-0 grid-cols-[80px_minmax(0,1fr)] gap-3"
            >
              <dt class="text-muted">Job title</dt>
              <dd class="min-w-0 break-words font-semibold text-ink">
                {{ employee.jobTitle }}
              </dd>
            </div>
            <div
              class="grid min-w-0 grid-cols-[80px_minmax(0,1fr)] gap-3"
            >
              <dt class="text-muted">Team</dt>
              <dd class="min-w-0 break-words text-ink">
                {{ employee.teamName }}
              </dd>
            </div>
            <div
              class="grid min-w-0 grid-cols-[80px_minmax(0,1fr)] gap-3"
            >
              <dt class="text-muted">Manager</dt>
              <dd class="min-w-0 break-words text-ink">
                {{ employee.managerName }}
              </dd>
            </div>
          </dl>

          <RouterLink
            :to="{
              name: 'employee-detail',
              params: { employeeId: employee.id },
            }"
            class="mt-4 inline-flex text-xs font-semibold text-brand hover:text-brand-dark"
          >
            View profile →
          </RouterLink>
        </article>
      </div>

      <div
        v-if="filteredEmployees.length"
        class="hidden overflow-x-auto border-x border-b border-line bg-surface md:block"
      >
        <table class="w-full min-w-[920px] border-collapse text-left">
          <caption class="sr-only">
            Employee directory
          </caption>
          <thead class="border-b border-line bg-surface-soft">
            <tr>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Employee
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Job title
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Team
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Manager
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Status
              </th>
              <th scope="col" class="px-5 py-3">
                <span class="sr-only">Profile</span>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-line">
            <tr
              v-for="employee in filteredEmployees"
              :key="employee.id"
              class="transition-colors hover:bg-surface-soft/70"
            >
              <td class="px-5 py-4">
                <RouterLink
                  :to="{
                    name: 'employee-detail',
                    params: { employeeId: employee.id },
                  }"
                  class="inline-flex items-center gap-3"
                >
                  <Avatar :name="employee.fullName" size="small" />
                  <span>
                    <strong class="block text-sm">{{
                      employee.fullName
                    }}</strong>
                    <span class="mt-0.5 block text-xs text-muted">
                      {{ employee.email }}
                    </span>
                  </span>
                </RouterLink>
              </td>
              <td class="px-5 py-4 text-sm text-ink">
                {{ employee.jobTitle }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ employee.teamName }}
              </td>
              <td class="px-5 py-4 text-sm text-muted">
                {{ employee.managerName }}
              </td>
              <td class="px-5 py-4">
                <StatusBadge :tone="employee.statusTone">
                  {{ employee.statusLabel }}
                </StatusBadge>
              </td>
              <td class="px-5 py-4 text-right">
                <RouterLink
                  :to="{
                    name: 'employee-detail',
                    params: { employeeId: employee.id },
                  }"
                  class="whitespace-nowrap text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  View profile →
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        icon="employees"
        :title="emptyStateCopy.title"
        :description="emptyStateCopy.description"
        class="border-t-0"
      >
        <template v-if="hasActiveFilters" #action>
          <button
            type="button"
            class="rounded-control border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-surface-soft"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </template>
      </EmptyState>
    </section>

    <EmployeeFormModal
      :open="employeeFormOpen"
      :company-id="session.currentCompany.value?.id ?? ''"
      @close="employeeFormOpen = false"
      @saved="handleEmployeeSaved"
    />
  </main>
</template>
