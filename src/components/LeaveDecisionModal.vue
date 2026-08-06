<script setup>
import { computed, ref, watch } from 'vue';
import AppButton from './AppButton.vue';
import AppModal from './AppModal.vue';

const props = defineProps({
  open: Boolean,
  request: {
    type: Object,
    default: null,
  },
  decision: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'submit']);
const comment = ref('');
const isApproval = computed(() => props.decision === 'approved');
const modalTitle = computed(() =>
  isApproval.value ? 'Approve leave request' : 'Decline leave request',
);

function handleSubmit() {
  emit('submit', {
    requestId: props.request?.id,
    decision: props.decision,
    comment: comment.value,
  });
}

watch(
  () => [props.open, props.request?.id, props.decision],
  ([open]) => {
    if (open) {
      comment.value = '';
    }
  },
);
</script>

<template>
  <AppModal :open="props.open" :title="modalTitle" @close="emit('close')">
    <form
      v-if="props.request"
      id="leave-decision-form"
      class="grid gap-5"
      @submit.prevent="handleSubmit"
    >
      <p
        v-if="props.error"
        class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
        role="alert"
      >
        {{ props.error }}
      </p>

      <div class="border-y border-line py-4">
        <strong class="block text-sm">{{ props.request.employeeName }}</strong>
        <p class="mt-1 text-xs text-muted">
          {{ props.request.typeLabel }} · {{ props.request.dateRangeLabel }} ·
          {{ props.request.durationLabel }}
        </p>
      </div>

      <div class="grid gap-1.5">
        <label for="manager-comment" class="text-xs font-semibold text-muted">
          Manager comment
          <span class="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id="manager-comment"
          v-model="comment"
          rows="4"
          class="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-subtle focus:border-brand"
          :placeholder="
            isApproval
              ? 'Add a note for the employee'
              : 'Explain why the request was declined'
          "
        />
      </div>

      <p class="text-xs leading-5 text-muted">
        The employee will receive a notification after this decision is saved.
      </p>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton
        type="submit"
        form="leave-decision-form"
        :variant="isApproval ? 'primary' : 'danger'"
      >
        {{ isApproval ? 'Approve request' : 'Decline request' }}
      </AppButton>
    </template>
  </AppModal>
</template>
