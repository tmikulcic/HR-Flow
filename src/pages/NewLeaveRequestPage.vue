<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import AppInput from '../components/AppInput.vue';
import AppSelect from '../components/AppSelect.vue';
import { LEAVE_TYPES } from '../domain/index.js';
import {
  getLeaveRequestContext,
  getLeaveRequestPreview,
  LEAVE_TYPE_OPTIONS,
  saveLeaveRequest,
} from '../services/leaveRequestService.js';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const router = useRouter();
const form = reactive({
  type: LEAVE_TYPES.ANNUAL,
  startDate: '',
  endDate: '',
  reason: '',
});
const errors = reactive({});
const submitting = ref(false);

const requestContext = computed(() =>
  getLeaveRequestContext(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
  ),
);

const requestPreview = computed(() =>
  getLeaveRequestPreview(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
    form,
  ),
);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function cancelRequest() {
  router.push({ name: 'leave-requests' });
}

function handleSubmit() {
  submitting.value = true;
  clearErrors();

  const result = saveLeaveRequest(
    session.currentCompany.value?.id,
    session.currentEmployee.value?.id,
    form,
  );

  submitting.value = false;

  if (!result.success) {
    Object.assign(errors, result.errors);

    return;
  }

  router.push({
    name: 'leave-requests',
    query: { created: '1' },
  });
}
</script>

<template>
  <main v-if="requestContext" class="mx-auto w-full max-w-[1180px]">
    <section class="border-b border-line pb-6">
      <p
        class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
      >
        Time off
      </p>
      <h2>New leave request</h2>
      <p class="mt-2 max-w-2xl text-sm text-muted">
        Enter the requested dates and provide a short reason for your manager.
      </p>
    </section>

    <section
      class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <article class="border border-line bg-surface">
        <header class="border-b border-line px-5 py-4">
          <h3>Request details</h3>
          <p class="mt-1 text-xs text-muted">
            All fields are required before submitting
          </p>
        </header>

        <form
          id="leave-request-form"
          class="grid gap-6 px-5 py-5"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <p
            v-if="errors.form"
            class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
          >
            {{ errors.form }}
          </p>

          <AppSelect
            v-model="form.type"
            label="Leave type"
            :options="LEAVE_TYPE_OPTIONS"
            :error="errors.type"
            required
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput
              v-model="form.startDate"
              label="Start date"
              type="date"
              :error="errors.startDate"
              required
            />
            <AppInput
              v-model="form.endDate"
              label="End date"
              type="date"
              :error="errors.endDate"
              required
            />
          </div>

          <div class="grid gap-1.5">
            <label for="leave-reason" class="text-xs font-semibold text-muted">
              Reason
              <span aria-hidden="true" class="text-danger">*</span>
            </label>
            <textarea
              id="leave-reason"
              v-model="form.reason"
              rows="5"
              placeholder="Briefly explain the reason for your request"
              :aria-invalid="Boolean(errors.reason)"
              :aria-describedby="
                errors.reason ? 'leave-reason-error' : undefined
              "
              :class="[
                'w-full resize-y rounded-control border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-subtle',
                errors.reason
                  ? 'border-danger focus:border-danger'
                  : 'border-line-strong focus:border-brand',
              ]"
            />
            <p
              v-if="errors.reason"
              id="leave-reason-error"
              class="text-xs text-danger"
            >
              {{ errors.reason }}
            </p>
          </div>
        </form>

        <footer
          class="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end"
        >
          <AppButton variant="secondary" @click="cancelRequest">
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            form="leave-request-form"
            :disabled="submitting"
          >
            Submit request
          </AppButton>
        </footer>
      </article>

      <aside class="border border-line bg-surface">
        <header class="border-b border-line px-5 py-4">
          <h3>Request summary</h3>
          <p class="mt-1 text-xs text-muted">Estimated balance impact</p>
        </header>

        <dl class="divide-y divide-line px-5">
          <div class="flex justify-between gap-4 py-4">
            <dt class="text-xs text-muted">Employee</dt>
            <dd class="text-right text-sm font-semibold">
              {{ requestContext.employee.fullName }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 py-4">
            <dt class="text-xs text-muted">Reviewer</dt>
            <dd class="text-right text-sm font-semibold">
              {{ requestContext.reviewer?.fullName ?? 'Not assigned' }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 py-4">
            <dt class="text-xs text-muted">Working days</dt>
            <dd class="text-right text-sm font-semibold tabular-nums">
              {{ requestPreview?.workingDays ?? 0 }}
            </dd>
          </div>
          <div class="py-4">
            <dt class="text-xs text-muted">Annual leave balance</dt>
            <dd class="mt-3 grid grid-cols-2 border border-line">
              <div class="border-r border-line px-3 py-3">
                <strong class="block text-lg tabular-nums">
                  {{ requestPreview?.currentRemainingDays ?? 0 }}
                </strong>
                <span class="text-[11px] text-muted">Available</span>
              </div>
              <div class="px-3 py-3">
                <strong class="block text-lg tabular-nums">
                  {{ requestPreview?.remainingAfterApproval ?? 0 }}
                </strong>
                <span class="text-[11px] text-muted">After approval</span>
              </div>
            </dd>
            <p
              v-if="requestPreview && !requestPreview.affectsAnnualBalance"
              class="mt-3 text-xs leading-5 text-info"
            >
              This leave type does not reduce the annual leave balance.
            </p>
          </div>
        </dl>

        <p
          class="border-t border-line bg-surface-soft px-5 py-4 text-xs leading-5 text-muted"
        >
          Saturdays and Sundays are excluded. The request will remain pending
          until the assigned reviewer makes a decision.
        </p>
      </aside>
    </section>
  </main>
</template>
