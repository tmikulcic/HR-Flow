<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  title: {
    type: String,
    default: 'HR-Flow',
  },
});

defineEmits(['open-navigation']);

</script>

<template>
  <header
    class="flex min-h-[74px] shrink-0 items-center border-b border-line bg-surface px-5 sm:px-page"
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
  </header>
</template>
