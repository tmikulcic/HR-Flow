<script setup>
import { computed } from 'vue';
import { useSessionStore } from '../stores/sessionStore.js';
import AppIcon from './AppIcon.vue';
import Avatar from './Avatar.vue';

const session = useSessionStore();

defineProps({
  title: {
    type: String,
    default: 'HR-Flow',
  },
});

defineEmits(['open-navigation']);

const currentEmployeeName = computed(() => {
  const employee = session.currentEmployee.value;

  if (employee) {
    return `${employee.firstName} ${employee.lastName}`;
  }

  return session.currentUser.value?.email ?? 'HR-Flow user';
});

</script>

<template>
  <header
    class="flex min-h-[74px] shrink-0 items-center justify-between border-b border-line bg-surface px-5 sm:px-page"
  >
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-control border border-line-strong text-muted hover:bg-surface-soft lg:hidden"
        aria-label="Open navigation"
        @click="$emit('open-navigation', $event)"
      >
        <AppIcon name="menu" :size="19" />
      </button>
      <h1 class="min-w-0 truncate text-lg">{{ title }}</h1>
    </div>

    <div class="flex items-center gap-2">
      <Avatar :name="currentEmployeeName" size="small" />
    </div>
  </header>
</template>
