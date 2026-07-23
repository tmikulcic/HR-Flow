<script setup>
import { computed } from 'vue'

const props = defineProps({
  tone: {
    type: String,
    default: 'neutral',
    validator: (value) => ['neutral', 'success', 'warning', 'danger', 'info'].includes(value),
  },
})

const toneClasses = {
  neutral: 'bg-surface-soft text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
}

const badgeClasses = computed(() => [
  'inline-flex items-center rounded-badge px-2 py-1 text-xs font-semibold',
  toneClasses[props.tone],
])
</script>

<template>
  <span :class="badgeClasses"><slot /></span>
</template>
