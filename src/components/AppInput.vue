<script setup>
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  disabled: Boolean,
  required: Boolean,
})

const emit = defineEmits(['update:modelValue'])
const generatedId = useId()
const inputId = computed(() => props.id || generatedId)
const messageId = computed(() => (props.error || props.hint ? `${inputId.value}-message` : undefined))

const inputClasses = computed(() => [
  'w-full rounded-control border bg-surface px-3 py-2 text-sm outline-none transition-colors',
  'placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-subtle',
  props.error
    ? 'border-danger focus:border-danger'
    : 'border-line-strong focus:border-brand',
])
</script>

<template>
  <div class="grid gap-1.5">
    <label v-if="props.label" :for="inputId" class="text-xs font-semibold text-muted">
      {{ props.label }}
      <span v-if="props.required" aria-hidden="true" class="text-danger">*</span>
    </label>
    <input
      v-bind="$attrs"
      :id="inputId"
      :value="props.modelValue"
      :type="props.type"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :required="props.required"
      :aria-invalid="Boolean(props.error)"
      :aria-describedby="messageId"
      :class="inputClasses"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <p v-if="props.error" :id="messageId" class="text-xs text-danger">{{ props.error }}</p>
    <p v-else-if="props.hint" :id="messageId" class="text-xs text-subtle">{{ props.hint }}</p>
  </div>
</template>
