<script setup>
import AppIcon from './AppIcon.vue'
import Avatar from './Avatar.vue'

defineProps({
  title: {
    type: String,
    default: 'HR-Flow',
  },
  subtitle: {
    type: String,
    default: '',
  },
})

defineEmits(['open-navigation'])
</script>

<template>
  <header class="flex min-h-[74px] items-center justify-between border-b border-line bg-surface px-5 sm:px-page">
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-control border border-line-strong text-muted hover:bg-surface-soft lg:hidden"
        aria-label="Open navigation"
        @click="$emit('open-navigation')"
      >
        <AppIcon name="menu" :size="19" />
      </button>
      <div class="min-w-0">
        <h1 class="truncate text-lg">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 truncate text-xs text-muted">{{ subtitle }}</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <RouterLink
        to="/notifications"
        class="relative grid size-9 place-items-center rounded-control border border-line-strong bg-surface text-muted hover:bg-surface-soft"
        aria-label="Notifications"
      >
        <AppIcon name="bell" :size="17" />
        <span class="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger" aria-hidden="true" />
      </RouterLink>
      <Avatar name="Olivia Carter" size="small" />
    </div>
  </header>
</template>
