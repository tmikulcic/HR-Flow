<script setup>
import { onBeforeUnmount, onMounted, useId } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: Boolean,
  title: {
    type: String,
    required: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])
const titleId = useId()

function closeModal() {
  emit('close')
}

function handleBackdrop() {
  if (props.closeOnBackdrop) closeModal()
}

function handleKeydown(event) {
  if (props.open && event.key === 'Escape') closeModal()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-5"
      @mousedown.self="handleBackdrop"
    >
      <section
        class="w-full max-w-lg border border-line-strong bg-surface"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="flex items-center justify-between border-b border-line bg-surface-soft px-5 py-4">
          <h2 :id="titleId" class="text-lg">{{ props.title }}</h2>
          <button
            type="button"
            class="grid size-8 place-items-center rounded-control text-muted hover:bg-line"
            aria-label="Close modal"
            @click="closeModal"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </header>
        <div class="px-5 py-5">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="flex justify-end gap-2 border-t border-line px-5 py-4">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>
