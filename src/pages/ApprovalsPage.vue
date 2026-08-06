<script setup>
import { computed, ref } from 'vue';
import AppButton from '../components/AppButton.vue';
import AppSelect from '../components/AppSelect.vue';
import Avatar from '../components/Avatar.vue';
import EmptyState from '../components/EmptyState.vue';
import LeaveDecisionModal from '../components/LeaveDecisionModal.vue';
import StatusBadge from '../components/StatusBadge.vue';
import {
  decideLeaveRequest,
  getLeaveApprovalData,
} from '../services/leaveApprovalService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const dataVersion = ref(0);
const selectedRequestId = ref('');
const sortOrder = ref('newest');
const decisionModalOpen = ref(false);
const decisionType = ref('');
const decisionError = ref('');
const feedbackMessage = ref('');

const approvalData = computed(() => {
  void dataVersion.value;

  return getLeaveApprovalData(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
    selectedRequestId.value,
  );
});

const sortedPendingRequests = computed(() => {
  const requests = [...(approvalData.value?.pendingRequests ?? [])];

  return sortOrder.value === 'oldest' ? requests.reverse() : requests;
});

const selectedRequest = computed(() => {
  const requests = approvalData.value?.pendingRequests ?? [];

  return (
    requests.find((request) => request.id === selectedRequestId.value) ??
    requests[0] ??
    null
  );
});

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

function selectCoverage(requestId) {
  selectedRequestId.value = requestId;
}

function openDecision(request, decision) {
  selectedRequestId.value = request.id;
  decisionType.value = decision;
  decisionError.value = '';
  decisionModalOpen.value = true;
}

function closeDecision() {
  decisionModalOpen.value = false;
  decisionError.value = '';
}

function handleDecision({ requestId, decision, comment }) {
  decisionError.value = '';

  const result = decideLeaveRequest(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
    requestId,
    decision,
    comment,
  );

  if (!result.success) {
    decisionError.value = result.error;

    return;
  }

  decisionModalOpen.value = false;
  dataVersion.value += 1;
  feedbackMessage.value = `Leave request ${decision}.`;
}
</script>

<template>
  <main v-if="approvalData" class="mx-auto w-full max-w-[1480px]">
    <section class="border-b border-line pb-6">
      <p
        class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
      >
        Manager workspace
      </p>
      <h2>Leave approvals</h2>
      <p class="mt-2 max-w-3xl text-sm text-muted">
        Review requested dates, team coverage and employee notes before making a
        decision.
      </p>
    </section>

    <p
      v-if="feedbackMessage"
      class="mt-6 border-l-2 border-success bg-success-soft px-4 py-3 text-sm text-success"
      role="status"
    >
      {{ feedbackMessage }} The employee has been notified.
    </p>

    <section
      class="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <article class="border border-line bg-surface">
        <header
          class="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h3>Pending requests</h3>
            <p class="mt-1 text-xs text-muted">
              {{ approvalData.pendingRequests.length }} awaiting your decision
            </p>
          </div>
          <AppSelect
            v-model="sortOrder"
            class="w-full sm:w-44"
            label="Sort requests"
            :options="sortOptions"
          />
        </header>

        <div v-if="sortedPendingRequests.length" class="divide-y divide-line">
          <article
            v-for="request in sortedPendingRequests"
            :key="request.id"
            class="px-5 py-5"
          >
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="flex items-center gap-3">
                <Avatar :name="request.employeeName" />
                <div>
                  <strong class="block text-sm">
                    {{ request.employeeName }}
                  </strong>
                  <span class="mt-0.5 block text-xs text-muted">
                    {{ request.employeeJobTitle }}
                  </span>
                </div>
              </div>
              <StatusBadge tone="warning">Pending</StatusBadge>
            </div>

            <dl
              class="mt-5 grid border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-line"
            >
              <div
                class="border-b border-line py-3 sm:border-b-0 sm:px-3 sm:first:pl-0"
              >
                <dt class="text-[11px] font-semibold text-muted">Leave type</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ request.typeLabel }}
                </dd>
              </div>
              <div class="border-b border-line py-3 sm:border-b-0 sm:px-3">
                <dt class="text-[11px] font-semibold text-muted">Dates</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ request.dateRangeLabel }}
                </dd>
              </div>
              <div class="py-3 sm:px-3 sm:last:pr-0">
                <dt class="text-[11px] font-semibold text-muted">Duration</dt>
                <dd class="mt-1 text-sm font-semibold">
                  {{ request.durationLabel }}
                </dd>
              </div>
            </dl>

            <p class="mt-4 text-sm leading-6 text-muted">
              <span class="font-semibold text-ink">Reason:</span>
              {{ request.reason }}
            </p>

            <div
              class="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <AppButton
                variant="ghost"
                size="small"
                @click="selectCoverage(request.id)"
              >
                Review team coverage
              </AppButton>
              <div class="flex gap-2 sm:justify-end">
                <AppButton
                  variant="danger"
                  size="small"
                  @click="openDecision(request, 'declined')"
                >
                  Decline
                </AppButton>
                <AppButton
                  size="small"
                  @click="openDecision(request, 'approved')"
                >
                  Approve
                </AppButton>
              </div>
            </div>
          </article>
        </div>

        <EmptyState
          v-else
          class="border-x-0 border-b-0"
          icon="approvals"
          title="No pending requests"
          description="All leave requests assigned to you have been processed."
        />
      </article>

      <aside class="grid content-start gap-6">
        <article class="border border-line bg-surface">
          <header class="border-b border-line px-5 py-4">
            <h3>Team coverage</h3>
            <p v-if="approvalData.coverage" class="mt-1 text-xs text-muted">
              {{ approvalData.coverage.employeeName }} ·
              {{ approvalData.coverage.dateRangeLabel }}
            </p>
            <p v-else class="mt-1 text-xs text-muted">
              Select a pending request
            </p>
          </header>

          <div v-if="approvalData.coverage" class="px-5 py-5">
            <div class="flex items-end justify-between gap-4">
              <span class="text-xs font-semibold text-muted">
                Available if approved
              </span>
              <strong class="text-sm tabular-nums">
                {{ approvalData.coverage.availableMembers }} /
                {{ approvalData.coverage.totalMembers }}
              </strong>
            </div>
            <div class="mt-3 h-2 bg-surface-soft" aria-hidden="true">
              <div
                class="h-full bg-brand"
                :style="{
                  width: `${approvalData.coverage.availabilityPercentage}%`,
                }"
              />
            </div>
            <p class="mt-2 text-right text-xs font-semibold text-brand">
              {{ approvalData.coverage.availabilityPercentage }}% coverage
            </p>

            <p
              v-if="approvalData.coverage.alreadyAway.length"
              class="mt-5 border-l-2 border-warning bg-warning-soft px-3 py-2 text-xs leading-5 text-warning"
            >
              Already away during these dates:
              {{ approvalData.coverage.alreadyAway.join(', ') }}.
            </p>
            <p v-else class="mt-5 text-xs leading-5 text-muted">
              No other approved leave overlaps with this request.
            </p>
          </div>
          <p v-else class="px-5 py-8 text-sm text-muted">
            Coverage will appear when a request is available for review.
          </p>
        </article>

        <article class="border border-line bg-surface">
          <header class="border-b border-line px-5 py-4">
            <h3>Decision history</h3>
            <p class="mt-1 text-xs text-muted">
              Your latest processed requests
            </p>
          </header>

          <div
            v-if="approvalData.decisionHistory.length"
            class="divide-y divide-line px-5"
          >
            <div
              v-for="request in approvalData.decisionHistory.slice(0, 5)"
              :key="request.id"
              class="py-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <strong class="block truncate text-sm">
                    {{ request.employeeName }}
                  </strong>
                  <p class="mt-1 text-xs text-muted">
                    {{ request.dateRangeLabel }} · {{ request.durationLabel }}
                  </p>
                </div>
                <StatusBadge :tone="request.statusTone">
                  {{ request.statusLabel }}
                </StatusBadge>
              </div>
              <p v-if="request.managerComment" class="mt-2 text-xs text-muted">
                “{{ request.managerComment }}”
              </p>
              <time class="mt-2 block text-[11px] text-subtle">
                {{ request.decidedLabel }}
              </time>
            </div>
          </div>
          <p v-else class="px-5 py-8 text-sm text-muted">
            No decisions have been recorded yet.
          </p>
        </article>
      </aside>
    </section>

    <LeaveDecisionModal
      :open="decisionModalOpen"
      :request="selectedRequest"
      :decision="decisionType"
      :error="decisionError"
      @close="closeDecision"
      @submit="handleDecision"
    />
  </main>
</template>
