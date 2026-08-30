<script setup>
import { computed, ref, watch } from 'vue';
import AppIcon from '../components/AppIcon.vue';
import AppInput from '../components/AppInput.vue';
import Avatar from '../components/Avatar.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusBadge from '../components/StatusBadge.vue';
import {
  getDefaultManagerTeamWeekStart,
  getManagerTeamOverview,
} from '../services/managerTeamService.js';
import { shiftWeek } from '../services/timeTrackingService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const searchQuery = ref('');
const weekStart = ref('');

const teamOverview = computed(() =>
  getManagerTeamOverview(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
    weekStart.value,
  ),
);

const filteredMembers = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase();

  if (!teamOverview.value || !normalizedQuery) {
    return teamOverview.value?.members ?? [];
  }

  return teamOverview.value.members.filter((member) =>
    [member.fullName, member.jobTitle, member.location].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );
});

function changeWeek(offset) {
  weekStart.value = shiftWeek(weekStart.value, offset);
}

watch(
  () => [session.currentCompany.value?.id, session.currentEmployee.value?.id],
  ([companyId, managerId]) => {
    if (companyId && managerId) {
      weekStart.value = getDefaultManagerTeamWeekStart(companyId, managerId);
    }
  },
  { immediate: true },
);
</script>

<template>
  <main v-if="teamOverview" class="mx-auto w-full max-w-[1480px]">
    <section
      class="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
        >
          Manager workspace
        </p>
        <h2>{{ teamOverview.team.name }} team</h2>
      </div>

      <RouterLink
        :to="{ name: 'approvals' }"
        class="inline-flex min-h-9 items-center justify-center self-start rounded-control border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft sm:self-auto"
      >
        Review approvals
      </RouterLink>
    </section>

    <section
      class="mt-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4"
      aria-label="Team summary"
    >
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">Team members:</span>
        <span class="text-base font-semibold text-brand">
          {{ teamOverview.summary.totalMembers }}
        </span>
      </article>
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">Available today:</span>
        <span class="text-base font-semibold text-brand">
          {{ teamOverview.summary.availableToday }}
        </span>
      </article>
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">On leave:</span>
        <span class="text-base font-semibold text-brand">
          {{ teamOverview.summary.onLeave }}
        </span>
      </article>
      <article class="flex items-center gap-2 bg-surface px-4 py-3">
        <span class="text-base font-semibold text-ink">Pending requests:</span>
        <span class="text-base font-semibold text-brand">
          {{ teamOverview.summary.pendingRequests }}
        </span>
      </article>
    </section>

    <section class="mt-6 border border-line bg-surface">
      <header
        class="grid gap-4 border-b border-line px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto_260px] lg:items-end"
      >
        <div>
          <h3>Team members</h3>
          <p class="mt-1 text-xs text-muted">
            Current availability and weekly recorded time
          </p>
        </div>

        <div
          class="grid w-full grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-2"
        >
          <button
            type="button"
            class="grid size-9 place-items-center rounded-control border border-line-strong text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Previous week"
            @click="changeWeek(-1)"
          >
            <AppIcon name="chevron-left" :size="17" />
          </button>
          <div class="text-center">
            <p class="text-xs font-semibold">{{ teamOverview.weekLabel }}</p>
            <p class="mt-0.5 text-[11px] text-subtle">40-hour target</p>
          </div>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-control border border-line-strong text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Next week"
            @click="changeWeek(1)"
          >
            <AppIcon name="chevron-right" :size="17" />
          </button>
        </div>

        <AppInput
          v-model="searchQuery"
          label="Search team"
          type="search"
          placeholder="Name, role or location"
        />
      </header>

      <div v-if="filteredMembers.length" class="overflow-x-auto">
        <table class="w-full min-w-[620px] border-collapse text-left">
          <caption class="sr-only">
            Team members, availability and weekly recorded time
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
                Availability
              </th>
              <th
                scope="col"
                class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Hours
              </th>
              <th scope="col" class="px-5 py-3">
                <span class="sr-only">Profile</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="member in filteredMembers" :key="member.id">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <Avatar :name="member.fullName" size="small" />
                  <div>
                    <strong class="block text-sm">{{ member.fullName }}</strong>
                    <span class="mt-0.5 block text-xs text-muted">
                      {{ member.jobTitle }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <StatusBadge :tone="member.availabilityTone">
                  {{ member.availabilityLabel }}
                </StatusBadge>
              </td>
              <td class="px-5 py-4 text-sm font-semibold tabular-nums">
                {{ member.totalLabel }}
              </td>
              <td class="px-5 py-4 text-right">
                <RouterLink
                  :to="{
                    name: 'employee-detail',
                    params: { employeeId: member.id },
                  }"
                  class="text-xs font-semibold text-brand hover:text-brand-dark"
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
        class="border-x-0 border-b-0"
        icon="employees"
        title="No team members found"
        description="Try a different name, role or location."
      />
    </section>
  </main>

  <EmptyState
    v-else
    class="mx-auto w-full max-w-[1480px]"
    icon="team"
    title="Team unavailable"
    description="No managed team is assigned to this account."
  />
</template>
