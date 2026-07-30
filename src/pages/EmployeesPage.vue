<script setup>
import { computed } from 'vue';
import Avatar from '../components/Avatar.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { getEmployeeDirectory } from '../services/employeeService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();

const employees = computed(() =>
  getEmployeeDirectory(session.currentCompany.value?.id),
);

const teamCount = computed(
  () => new Set(employees.value.map((employee) => employee.teamId)).size,
);
</script>

<template>
  <main class="mx-auto w-full max-w-[1480px]">
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
    </section>

    <section class="mt-6 overflow-hidden border border-line bg-surface">
      <div v-if="employees.length" class="overflow-x-auto">
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
              v-for="employee in employees"
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

      <div v-else class="px-5 py-12 text-center">
        <h3>No employees found</h3>
        <p class="mt-2 text-sm text-muted">
          This company does not have any employee records yet.
        </p>
      </div>
    </section>
  </main>
</template>
