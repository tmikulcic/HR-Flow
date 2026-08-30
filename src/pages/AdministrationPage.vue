<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppInput from '../components/AppInput.vue';
import AppSelect from '../components/AppSelect.vue';
import Avatar from '../components/Avatar.vue';
import EmptyState from '../components/EmptyState.vue';
import InviteUserModal from '../components/InviteUserModal.vue';
import ManageUserModal from '../components/ManageUserModal.vue';
import StatusBadge from '../components/StatusBadge.vue';
import TeamFormModal from '../components/TeamFormModal.vue';
import {
  COMPANY_TIMEZONE_OPTIONS,
  getAdministrationOverview,
  saveCompanySettings,
} from '../services/administrationService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const activeTab = ref('users');
const searchQuery = ref('');
const dataVersion = ref(0);
const inviteModalOpen = ref(false);
const manageModalOpen = ref(false);
const teamModalOpen = ref(false);
const selectedUser = ref(null);
const selectedTeam = ref(null);
const statusMessage = ref('');
const companyErrors = reactive({});
const companyForm = reactive({ name: '', timezone: '' });

const overview = computed(() => {
  dataVersion.value;

  return getAdministrationOverview(
    session.currentCompany.value?.id,
    session.currentUser.value?.id,
  );
});

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) {
    return overview.value?.users ?? [];
  }

  return (overview.value?.users ?? []).filter((user) =>
    [user.fullName, user.email, user.roleLabel, user.teamName].some((value) =>
      value.toLowerCase().includes(query),
    ),
  );
});

const summaryItems = computed(() => [
  { label: 'Total users', value: overview.value?.summary.totalUsers ?? 0 },
  { label: 'Active access', value: overview.value?.summary.activeUsers ?? 0 },
  {
    label: 'Pending invites',
    value: overview.value?.summary.invitedUsers ?? 0,
  },
  { label: 'Teams', value: overview.value?.summary.totalTeams ?? 0 },
]);

const tabs = [
  { value: 'users', label: 'Users and access' },
  { value: 'teams', label: 'Teams' },
  { value: 'company', label: 'Company' },
];

function clearCompanyErrors() {
  Object.keys(companyErrors).forEach((key) => delete companyErrors[key]);
}

function handleTabKeydown(event, currentIndex) {
  let nextIndex = null;

  if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = tabs.length - 1;
  }

  if (nextIndex === null) {
    return;
  }

  event.preventDefault();
  const tabList = event.currentTarget.parentElement;
  activeTab.value = tabs[nextIndex].value;
  nextTick(() => {
    tabList?.querySelector(`[data-tab-index="${nextIndex}"]`)?.focus();
  });
}

function refreshData(message) {
  dataVersion.value += 1;
  session.initializeSession();
  statusMessage.value = message;
}

function openManageUser(user) {
  selectedUser.value = user;
  manageModalOpen.value = true;
  statusMessage.value = '';
}

function openTeamForm(team = null) {
  selectedTeam.value = team;
  teamModalOpen.value = true;
  statusMessage.value = '';
}

function handleUserInvited(user) {
  inviteModalOpen.value = false;
  searchQuery.value = '';
  refreshData(`Invitation created for ${user.email}.`);
}

function handleUserSaved() {
  const email = selectedUser.value?.email ?? 'the user';
  manageModalOpen.value = false;
  selectedUser.value = null;
  refreshData(`Access settings updated for ${email}.`);
}

function handleTeamSaved(team) {
  teamModalOpen.value = false;
  selectedTeam.value = null;
  refreshData(`${team.name} team settings were saved.`);
}

function handleCompanySubmit() {
  clearCompanyErrors();

  const result = saveCompanySettings(
    session.currentCompany.value?.id,
    session.currentUser.value?.id,
    companyForm,
  );

  if (!result.success) {
    Object.assign(companyErrors, result.errors);

    return;
  }

  refreshData('Company settings were saved.');
}

watch(
  () => [overview.value?.company?.name, overview.value?.company?.timezone],
  ([name, timezone]) => {
    companyForm.name = name ?? '';
    companyForm.timezone = timezone ?? '';
    clearCompanyErrors();
  },
  { immediate: true },
);
</script>

<template>
  <main v-if="overview" class="mx-auto w-full max-w-[1480px]">
    <section class="border-b border-line pb-6">
      <h2>Administration</h2>
    </section>

    <p
      v-if="statusMessage"
      class="mt-6 border-l-2 border-success bg-success-soft px-4 py-3 text-sm text-success"
      role="status"
    >
      {{ statusMessage }}
    </p>

    <section
      class="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Administration summary"
    >
      <article
        v-for="item in summaryItems"
        :key="item.label"
        class="flex items-center gap-2 bg-surface px-4 py-3"
      >
        <span class="text-base font-semibold text-ink">
          {{ item.label }}:
        </span>
        <span class="text-base font-semibold text-brand">{{ item.value }}</span>
      </article>
    </section>

    <section class="mt-6">
      <nav
        class="flex overflow-x-auto border border-line bg-surface px-4"
        aria-label="Administration sections"
        role="tablist"
      >
        <button
          v-for="(tab, index) in tabs"
          :key="tab.value"
          :id="`administration-tab-${tab.value}`"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.value"
          :aria-controls="`administration-panel-${tab.value}`"
          :tabindex="activeTab === tab.value ? 0 : -1"
          :data-tab-index="index"
          :class="[
            '-mb-px min-h-12 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors',
            activeTab === tab.value
              ? 'border-brand text-brand'
              : 'border-transparent text-muted hover:text-ink',
          ]"
          @click="activeTab = tab.value"
          @keydown="handleTabKeydown($event, index)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div
        v-if="activeTab === 'users'"
        id="administration-panel-users"
        class="border-x border-b border-line bg-surface"
        role="tabpanel"
        aria-labelledby="administration-tab-users"
        tabindex="0"
      >
        <header
          class="grid gap-4 border-b border-line px-5 py-4 md:grid-cols-[minmax(0,1fr)_280px_auto] md:items-end"
        >
          <div>
            <h3>Users and access</h3>
            <p class="mt-1 text-xs text-muted">
              Roles control navigation and permissions across HR-Flow.
            </p>
          </div>
          <AppInput
            v-model="searchQuery"
            label="Search users"
            type="search"
            placeholder="Name, email, role or team"
          />
          <AppButton @click="inviteModalOpen = true">Invite user</AppButton>
        </header>

        <div v-if="filteredUsers.length" class="overflow-x-auto">
          <table class="w-full min-w-[680px] border-collapse text-left">
            <caption class="sr-only">
              Company users, roles, teams and access status
            </caption>
            <thead class="border-b border-line bg-surface-soft">
              <tr>
                <th
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                  scope="col"
                >
                  User
                </th>
                <th
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                  scope="col"
                >
                  Role
                </th>
                <th
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                  scope="col"
                >
                  Team
                </th>
                <th
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                  scope="col"
                >
                  Access
                </th>
                <th class="px-5 py-3" scope="col">
                  <span class="sr-only">Manage</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="user in filteredUsers" :key="user.id">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <Avatar :name="user.fullName" size="small" />
                    <div class="min-w-0">
                      <strong class="block truncate text-sm">
                        {{ user.fullName }}
                      </strong>
                      <span class="mt-0.5 block truncate text-xs text-muted">
                        {{ user.email }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <StatusBadge :tone="user.roleTone">
                    {{ user.roleLabel }}
                  </StatusBadge>
                </td>
                <td class="px-5 py-4 text-sm text-muted">
                  {{ user.teamName }}
                </td>
                <td class="px-5 py-4">
                  <StatusBadge :tone="user.accessTone">
                    {{ user.accessLabel }}
                  </StatusBadge>
                </td>
                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    class="text-xs font-semibold text-brand hover:text-brand-dark"
                    @click="openManageUser(user)"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState
          v-else
          class="border-x-0 border-b-0"
          icon="employees"
          title="No matching users"
          description="Try another name, email, role or team."
        />
      </div>

      <div
        v-else-if="activeTab === 'teams'"
        id="administration-panel-teams"
        class="border-x border-b border-line bg-surface"
        role="tabpanel"
        aria-labelledby="administration-tab-teams"
        tabindex="0"
      >
        <header
          class="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3>Company teams</h3>
            <p class="mt-1 text-xs text-muted">
              Assign a manager and keep reporting relationships consistent.
            </p>
          </div>
          <AppButton class="self-start sm:self-auto" @click="openTeamForm()">
            Add team
          </AppButton>
        </header>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] border-collapse text-left">
            <caption class="sr-only">
              Company teams and assigned managers
            </caption>
            <thead class="border-b border-line bg-surface-soft">
              <tr>
                <th
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                  scope="col"
                >
                  Team
                </th>
                <th
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                  scope="col"
                >
                  Manager
                </th>
                <th
                  class="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted"
                  scope="col"
                >
                  Members
                </th>
                <th class="px-5 py-3" scope="col">
                  <span class="sr-only">Manage</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="team in overview.teams" :key="team.id">
                <td class="px-5 py-4">
                  <strong class="text-sm">{{ team.name }}</strong>
                </td>
                <td class="px-5 py-4 text-sm text-muted">
                  {{ team.managerName }}
                </td>
                <td class="px-5 py-4 text-sm tabular-nums">
                  {{ team.memberCount }}
                </td>
                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    class="text-xs font-semibold text-brand hover:text-brand-dark"
                    @click="openTeamForm(team)"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-else
        id="administration-panel-company"
        class="border-x border-b border-line bg-surface"
        role="tabpanel"
        aria-labelledby="administration-tab-company"
        tabindex="0"
      >
        <header class="border-b border-line px-5 py-4">
          <h3>Company information</h3>
          <p class="mt-1 text-xs text-muted">
            These values identify the active HR-Flow workspace.
          </p>
        </header>

        <form
          class="grid max-w-2xl gap-5 px-5 py-5"
          @submit.prevent="handleCompanySubmit"
        >
          <p
            v-if="companyErrors.form"
            class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
            role="alert"
          >
            {{ companyErrors.form }}
          </p>

          <AppInput
            v-model="companyForm.name"
            label="Company name"
            :error="companyErrors.name"
            required
          />
          <div class="grid gap-1.5">
            <label class="text-xs font-semibold text-muted" for="company-id">
              Company ID
            </label>
            <input
              id="company-id"
              :value="overview.company.id"
              type="text"
              disabled
            />
            <p class="text-xs text-subtle">
              The local company identifier cannot be changed.
            </p>
          </div>
          <AppSelect
            v-model="companyForm.timezone"
            label="Timezone"
            :options="COMPANY_TIMEZONE_OPTIONS"
            :error="companyErrors.timezone"
            required
          />

          <div>
            <AppButton type="submit">Save company settings</AppButton>
          </div>
        </form>
      </div>
    </section>

    <InviteUserModal
      :open="inviteModalOpen"
      :company-id="overview.company.id"
      :administrator-user-id="session.currentUser.value?.id ?? ''"
      :options="overview.options"
      @close="inviteModalOpen = false"
      @saved="handleUserInvited"
    />

    <ManageUserModal
      :open="manageModalOpen"
      :company-id="overview.company.id"
      :administrator-user-id="session.currentUser.value?.id ?? ''"
      :user="selectedUser"
      :options="overview.options"
      @close="manageModalOpen = false"
      @saved="handleUserSaved"
    />

    <TeamFormModal
      :open="teamModalOpen"
      :company-id="overview.company.id"
      :administrator-user-id="session.currentUser.value?.id ?? ''"
      :team="selectedTeam"
      :manager-options="overview.options.managers"
      @close="teamModalOpen = false"
      @saved="handleTeamSaved"
    />
  </main>

  <EmptyState
    v-else
    class="mx-auto w-full max-w-[1480px]"
    icon="settings"
    title="Administration unavailable"
    description="Administrator access and a valid company are required."
  />
</template>
