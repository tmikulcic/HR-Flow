<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import AppIcon from './AppIcon.vue';

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
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'large'].includes(value),
  },
});

const emit = defineEmits(['close']);
const titleId = useId();
const dialog = ref(null);
let previouslyFocusedElement = null;
let previousBodyOverflow = '';
const modalClasses = computed(() => [
  'flex h-full max-h-none w-full flex-col border border-line-strong bg-surface sm:h-auto sm:max-h-[calc(100vh-2.5rem)]',
  props.size === 'large' ? 'max-w-3xl' : 'max-w-lg',
]);

function getFocusableElements() {
  return [
    ...(dialog.value?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []),
  ].filter(
    (element) =>
      !element.hasAttribute('hidden') && element.getClientRects().length > 0,
  );
}

function closeModal() {
  emit('close');
}

function handleBackdrop() {
  if (props.closeOnBackdrop) closeModal();
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();

    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusableElements = getFocusableElements();

  if (!focusableElements.length) {
    event.preventDefault();
    dialog.value?.focus();

    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function restorePageState() {
  document.body.style.overflow = previousBodyOverflow;
  previouslyFocusedElement?.focus();
  previouslyFocusedElement = null;
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      restorePageState();

      return;
    }

    previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    await nextTick();

    const focusableElements = getFocusableElements();
    const initialFocus =
      focusableElements.find((element) => element.hasAttribute('autofocus')) ??
      focusableElements.find((element) =>
        element.closest('[data-modal-content]'),
      ) ??
      focusableElements[0] ??
      dialog.value;

    initialFocus?.focus();
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  if (props.open) {
    restorePageState();
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-0 sm:p-5"
      @mousedown.self="handleBackdrop"
      @keydown="handleKeydown"
    >
      <section
        ref="dialog"
        :class="modalClasses"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <header
          class="flex items-center justify-between border-b border-line bg-surface-soft px-5 py-4"
        >
          <h2 :id="titleId" class="text-lg">{{ props.title }}</h2>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-control text-muted hover:bg-line"
            aria-label="Close modal"
            @click="closeModal"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </header>
        <div class="overflow-y-auto px-5 py-5" data-modal-content>
          <slot />
        </div>
        <footer
          v-if="$slots.footer"
          class="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end"
        >
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>
