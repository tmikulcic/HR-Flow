<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'small'].includes(value),
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value),
  },
  disabled: Boolean,
})

const variantClasses = {
  primary: 'border-brand bg-brand text-white hover:bg-brand-dark',
  secondary: 'border-line-strong bg-surface text-ink hover:bg-surface-soft',
  danger: 'border-danger bg-danger text-white hover:opacity-90',
  ghost: 'border-transparent bg-transparent text-brand hover:bg-brand-soft',
}

const sizeClasses = {
  default: 'min-h-9 px-3.5 py-2 text-sm',
  small: 'min-h-8 px-2.5 py-1.5 text-xs',
}

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-control border font-semibold transition-colors',
  'disabled:pointer-events-none disabled:opacity-50',
  variantClasses[props.variant],
  sizeClasses[props.size],
])
</script>

<template>
  <button :type="props.type" :disabled="props.disabled" :class="buttonClasses">
    <slot />
  </button>
</template>
