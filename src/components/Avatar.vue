<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  initials: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  tone: {
    type: String,
    default: 'brand',
    validator: (value) => ['brand', 'success', 'warning', 'info'].includes(value),
  },
})

const displayedInitials = computed(() => {
  if (props.initials) return props.initials.slice(0, 2).toUpperCase()

  return props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
})

const sizeClasses = {
  small: 'size-8 text-xs',
  medium: 'size-10 text-sm',
  large: 'size-16 text-lg',
}

const toneClasses = {
  brand: 'bg-brand-soft text-brand-dark',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
}

const avatarClasses = computed(() => [
  'inline-grid shrink-0 place-items-center rounded-full font-bold',
  sizeClasses[props.size],
  toneClasses[props.tone],
])
</script>

<template>
  <span :class="avatarClasses" :aria-label="props.name" role="img">{{ displayedInitials }}</span>
</template>
