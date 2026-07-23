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
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
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
const selectId = computed(() => props.id || generatedId)
const errorId = computed(() => (props.error ? `${selectId.value}-error` : undefined))
</script>

<template>
  <div class="grid gap-1.5">
    <label v-if="props.label" :for="selectId" class="text-xs font-semibold text-muted">
      {{ props.label }}
      <span v-if="props.required" aria-hidden="true" class="text-danger">*</span>
    </label>
    <select
      v-bind="$attrs"
      :id="selectId"
      :value="props.modelValue"
      :disabled="props.disabled"
      :required="props.required"
      :aria-invalid="Boolean(props.error)"
      :aria-describedby="errorId"
      class="w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-subtle"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option v-if="props.placeholder" value="" disabled>{{ props.placeholder }}</option>
      <option
        v-for="option in props.options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="props.error" :id="errorId" class="text-xs text-danger">{{ props.error }}</p>
  </div>
</template>
