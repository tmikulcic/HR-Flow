<script setup>
import AppIcon from './AppIcon.vue'
import Avatar from './Avatar.vue'
import BrandLogo from './BrandLogo.vue'

defineProps({
  open: Boolean,
})

const emit = defineEmits(['close', 'navigate'])

const workspaceItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'home' },
  { label: 'Employees', to: '/employees', icon: 'employees' },
  { label: 'Time tracking', to: '/time-tracking', icon: 'clock' },
  { label: 'My leave', to: '/leave-requests', icon: 'calendar' },
  { label: 'My team', to: '/team', icon: 'team' },
  { label: 'Approvals', to: '/approvals', icon: 'approvals', badge: 3 },
  { label: 'Notifications', to: '/notifications', icon: 'bell', badge: 4 },
]

const administrationItems = [
  { label: 'Administration', to: '/administration', icon: 'settings' },
]

function handleNavigation(event, navigate) {
  navigate(event)
  emit('navigate')
}
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col bg-sidebar px-4 py-5 text-white transition-transform duration-200',
      'lg:static lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Primary navigation"
  >
    <div class="flex items-center justify-between px-2 pb-7">
      <BrandLogo />
      <button
        type="button"
        class="grid size-8 place-items-center rounded-control text-[#bdd2cc] hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Close navigation"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="18" />
      </button>
    </div>

    <nav class="grid gap-6">
      <div>
        <p class="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8fb1a9]">
          Workspace
        </p>
        <ul class="grid gap-1">
          <li v-for="item in workspaceItems" :key="item.to">
            <RouterLink v-slot="{ href, navigate, isActive }" :to="item.to" custom>
              <a
                :href="href"
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
                    isActive ? 'bg-[#8ee0ca] text-sidebar' : 'bg-white/6 text-[#9cc8bd]',
                  ]"
                >
                  <AppIcon :name="item.icon" :size="15" />
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

      <div>
        <p class="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8fb1a9]">
          Admin
        </p>
        <ul class="grid gap-1">
          <li v-for="item in administrationItems" :key="item.to">
            <RouterLink v-slot="{ href, navigate, isActive }" :to="item.to" custom>
              <a
                :href="href"
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
                    isActive ? 'bg-[#8ee0ca] text-sidebar' : 'bg-white/6 text-[#9cc8bd]',
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

    <div class="mt-auto flex items-center gap-3 border-t border-white/10 px-2 pt-4">
      <Avatar name="Olivia Carter" size="small" />
      <div class="min-w-0">
        <strong class="block truncate text-xs">Olivia Carter</strong>
        <span class="block truncate text-[10px] text-[#95b6ae]">HR Manager</span>
      </div>
    </div>
  </aside>
</template>
