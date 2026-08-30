<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { hasPermission, PERMISSIONS } from '../domain/index.js';
import { getPendingApprovalCount } from '../services/leaveApprovalService.js';
import { getUnreadNotificationCount } from '../services/notificationService.js';
import { useSessionStore } from '../stores/sessionStore.js';
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';
import Avatar from './Avatar.vue';
import BrandLogo from './BrandLogo.vue';

const props = defineProps({
  open: Boolean,
});

const emit = defineEmits(['close', 'navigate']);
const session = useSessionStore();
const router = useRouter();
const sidebar = ref(null);
const closeButton = ref(null);

const workspaceItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'home',
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    label: 'Employees',
    to: '/employees',
    icon: 'employees',
    permission: PERMISSIONS.VIEW_EMPLOYEES,
  },
  {
    label: 'Time tracking',
    to: '/time-tracking',
    icon: 'clock',
    permission: PERMISSIONS.TRACK_TIME,
  },
  {
    label: 'My leave',
    to: '/leave-requests',
    icon: 'calendar',
    permission: PERMISSIONS.MANAGE_OWN_LEAVE,
  },
  {
    label: 'My team',
    to: '/team',
    icon: 'team',
    permission: PERMISSIONS.VIEW_TEAM,
  },
  {
    label: 'Approvals',
    to: '/approvals',
    icon: 'approvals',
    permission: PERMISSIONS.REVIEW_LEAVE_REQUESTS,
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: 'bell',
    permission: PERMISSIONS.VIEW_NOTIFICATIONS,
  },
];

const administrationItems = [
  {
    label: 'Administration',
    to: '/administration',
    icon: 'settings',
    permission: PERMISSIONS.MANAGE_ADMINISTRATION,
  },
];

const visibleWorkspaceItems = computed(() => {
  const pendingApprovals = getPendingApprovalCount(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
  );
  const unreadNotifications = getUnreadNotificationCount(
    session.currentCompany.value?.id,
    session.currentUser.value?.id,
  );

  return workspaceItems
    .filter((item) => hasPermission(session.currentRole.value, item.permission))
    .map((item) => ({
      ...item,
      badge: item.to === '/approvals' ? pendingApprovals : 0,
      iconBadge: item.to === '/notifications' ? unreadNotifications : 0,
    }));
});

const visibleAdministrationItems = computed(() =>
  administrationItems.filter((item) =>
    hasPermission(session.currentRole.value, item.permission),
  ),
);

const currentEmployeeName = computed(() => {
  const employee = session.currentEmployee.value;

  if (employee) {
    return `${employee.firstName} ${employee.lastName}`;
  }

  return session.currentUser.value?.email ?? 'HR-Flow user';
});

const currentJobTitle = computed(
  () => session.currentEmployee.value?.jobTitle ?? session.currentRole.value,
);

function handleNavigation(event, navigate) {
  navigate(event);
  emit('navigate');
}

async function handleSignOut() {
  await session.signOut();
  emit('close');
  await router.replace({ name: 'login' });
}

function getFocusableElements() {
  return [
    ...(sidebar.value?.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []),
  ].filter(
    (element) =>
      !element.hasAttribute('hidden') && element.getClientRects().length > 0,
  );
}

function handleKeydown(event) {
  if (!props.open) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');

    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusableElements = getFocusableElements();
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await nextTick();
      closeButton.value?.focus();
    }
  },
);
</script>

<template>
  <aside
    ref="sidebar"
    :class="[
      'fixed inset-y-0 left-0 z-40 flex h-dvh w-[244px] flex-col overflow-hidden bg-sidebar px-4 py-5 text-white transition-transform duration-200',
      'lg:sticky lg:top-0 lg:bottom-auto lg:self-start lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Primary navigation"
    @keydown="handleKeydown"
  >
    <div class="flex shrink-0 items-center justify-between px-2 pb-7">
      <BrandLogo />
      <button
        ref="closeButton"
        type="button"
        class="grid size-8 place-items-center rounded-control text-[#bdd2cc] hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Close navigation"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="18" />
      </button>
    </div>

    <nav class="grid min-h-0 flex-1 content-start gap-6 overflow-y-auto">
      <div>
        <p
          class="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8fb1a9]"
        >
          Workspace
        </p>
        <ul class="grid gap-1">
          <li v-for="item in visibleWorkspaceItems" :key="item.to">
            <RouterLink
              v-slot="{ href, navigate, isActive }"
              :to="item.to"
              custom
            >
              <a
                :href="href"
                :aria-current="isActive ? 'page' : undefined"
                :class="[
                  'flex min-h-10 items-center gap-3 rounded-nav px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-[#bdd2cc] hover:bg-white/7 hover:text-white',
                ]"
                @click="handleNavigation($event, navigate)"
              >
                <span
                  :class="[
                    'relative grid size-6 shrink-0 place-items-center rounded-badge',
                    isActive
                      ? 'bg-[#8ee0ca] text-sidebar'
                      : 'bg-white/6 text-[#9cc8bd]',
                  ]"
                >
                  <AppIcon :name="item.icon" :size="15" />
                  <span
                    v-if="item.iconBadge"
                    class="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white"
                    aria-label="Unread notifications"
                  >
                    {{ item.iconBadge }}
                  </span>
                </span>
                <span>{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="ml-auto rounded-badge bg-[#8ee0ca] px-2 py-0.5 text-[10px] font-bold text-sidebar"
                >
                  {{ item.badge }}
                </span>
              </a>
            </RouterLink>
          </li>
        </ul>
      </div>

      <div v-if="visibleAdministrationItems.length">
        <p
          class="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8fb1a9]"
        >
          Admin
        </p>
        <ul class="grid gap-1">
          <li v-for="item in visibleAdministrationItems" :key="item.to">
            <RouterLink
              v-slot="{ href, navigate, isActive }"
              :to="item.to"
              custom
            >
              <a
                :href="href"
                :aria-current="isActive ? 'page' : undefined"
                :class="[
                  'flex min-h-10 items-center gap-3 rounded-nav px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-[#bdd2cc] hover:bg-white/7 hover:text-white',
                ]"
                @click="handleNavigation($event, navigate)"
              >
                <span
                  :class="[
                    'grid size-6 shrink-0 place-items-center rounded-badge',
                    isActive
                      ? 'bg-[#8ee0ca] text-sidebar'
                      : 'bg-white/6 text-[#9cc8bd]',
                  ]"
                >
                  <AppIcon :name="item.icon" :size="15" />
                </span>
                <span>{{ item.label }}</span>
              </a>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <div
      class="mt-auto flex shrink-0 items-center gap-3 border-t border-white/10 px-2 pt-4"
    >
      <Avatar :name="currentEmployeeName" size="small" />
      <div class="min-w-0">
        <strong class="block truncate text-xs">{{
          currentEmployeeName
        }}</strong>
        <span class="block truncate text-[10px] text-[#95b6ae]">
          {{ currentJobTitle }}
        </span>
      </div>
      <button
        type="button"
        class="ml-auto grid size-8 shrink-0 place-items-center rounded-control text-[#95b6ae] hover:bg-white/10 hover:text-white"
        aria-label="Sign out"
        title="Sign out"
        @click="handleSignOut"
      >
        <AppIcon name="logout" :size="17" />
      </button>
    </div>
  </aside>
</template>
