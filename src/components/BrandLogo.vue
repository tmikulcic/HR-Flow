<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  compact: Boolean,
  to: {
    type: String,
    default: '/dashboard',
  },
  variant: {
    type: String,
    default: 'light',
    validator: (value) => ['light', 'dark'].includes(value),
  },
});

const brandClasses = computed(() => [
  'inline-flex items-center gap-3',
  props.variant === 'light' ? 'text-white' : 'text-ink',
]);
</script>

<template>
  <RouterLink :to="props.to" :class="brandClasses" aria-label="HR-Flow">
    <span
      class="grid size-9 place-items-center rounded-badge bg-[#8ee0ca] text-sidebar"
    >
      <AppIcon name="team" :size="20" />
    </span>
    <strong v-if="!compact" class="text-xl tracking-tight">HR-Flow</strong>
  </RouterLink>
</template>
