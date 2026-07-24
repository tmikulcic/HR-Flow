<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  compact: Boolean,
})
</script>

<template>
  <RouterLink to="/dashboard" class="inline-flex items-center gap-3 text-white" aria-label="HR-Flow dashboard">
    <span class="grid size-9 place-items-center rounded-badge bg-[#8ee0ca] text-sidebar">
      <AppIcon name="team" :size="20" />
    </span>
    <strong v-if="!compact" class="text-xl tracking-tight">HR-Flow</strong>
  </RouterLink>
</template>
