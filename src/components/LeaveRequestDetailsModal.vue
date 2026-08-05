<script setup>
import AppButton from './AppButton.vue';
import AppModal from './AppModal.vue';
import StatusBadge from './StatusBadge.vue';

const props = defineProps({
  open: Boolean,
  request: {
    type: Object,
    default: null,
  },
  error: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'withdraw']);
</script>

<template>
  <AppModal
    :open="props.open"
    title="Leave request details"
    @close="emit('close')"
  >
    <div v-if="props.request" class="grid gap-5">
      <p
        v-if="props.error"
        class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
        role="alert"
      >
        {{ props.error }}
      </p>

      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold text-muted">Leave type</p>
          <h3 class="mt-1">{{ props.request.typeLabel }}</h3>
        </div>
        <StatusBadge :tone="props.request.statusTone">
          {{ props.request.statusLabel }}
        </StatusBadge>
      </div>

      <dl class="divide-y divide-line border-y border-line">
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-xs text-muted">Dates</dt>
          <dd class="text-right text-sm font-semibold">
            {{ props.request.dateRangeLabel }}
          </dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-xs text-muted">Duration</dt>
          <dd class="text-right text-sm font-semibold">
            {{ props.request.durationLabel }}
          </dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-xs text-muted">Reviewer</dt>
          <dd class="text-right text-sm font-semibold">
            {{ props.request.reviewerName }}
          </dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-xs text-muted">Submitted</dt>
          <dd class="text-right text-sm font-semibold">
            {{ props.request.submittedLabel }}
          </dd>
        </div>
        <div
          v-if="props.request.decidedAt"
          class="flex justify-between gap-4 py-3"
        >
          <dt class="text-xs text-muted">Processed</dt>
          <dd class="text-right text-sm font-semibold">
            {{ props.request.decidedLabel }}
          </dd>
        </div>
      </dl>

      <div>
        <p class="text-xs font-semibold text-muted">Reason</p>
        <p class="mt-2 text-sm leading-6">{{ props.request.reason }}</p>
      </div>

      <div v-if="props.request.managerComment">
        <p class="text-xs font-semibold text-muted">Manager comment</p>
        <p class="mt-2 border-l-2 border-line-strong pl-3 text-sm leading-6">
          {{ props.request.managerComment }}
        </p>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Close</AppButton>
      <AppButton
        v-if="props.request?.canWithdraw"
        variant="danger"
        @click="emit('withdraw', props.request.id)"
      >
        Withdraw request
      </AppButton>
    </template>
  </AppModal>
</template>
