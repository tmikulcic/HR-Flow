<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'inbox',
  },
})
</script>

<template>
  <div class="grid justify-items-center border border-line-strong bg-surface px-6 py-10 text-center">
    <div class="mb-4 grid size-10 place-items-center bg-brand-soft text-brand">
      <slot name="icon"><AppIcon :name="props.icon" /></slot>
    </div>
    <h3>{{ props.title }}</h3>
    <p v-if="props.description" class="mt-1 max-w-md text-sm text-muted">
      {{ props.description }}
    </p>
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
