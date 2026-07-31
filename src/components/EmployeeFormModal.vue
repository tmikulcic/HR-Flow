<script setup>
import { computed, reactive, ref, watch } from 'vue';
import {
  getEmployeeFormData,
  getEmployeeFormOptions,
  saveEmployee,
} from '../services/employeeManagementService.js';
import AppButton from './AppButton.vue';
import AppInput from './AppInput.vue';
import AppModal from './AppModal.vue';
import AppSelect from './AppSelect.vue';

const props = defineProps({
  open: Boolean,
  companyId: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'saved']);
const form = reactive({});
const errors = reactive({});
const submitting = ref(false);

const isEditing = computed(() => Boolean(props.employeeId));
const modalTitle = computed(() =>
  isEditing.value ? 'Edit employee' : 'Add employee',
);
const options = computed(() =>
  getEmployeeFormOptions(props.companyId, props.employeeId),
);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function resetForm() {
  Object.assign(form, getEmployeeFormData(props.companyId, props.employeeId));
  clearErrors();
}

function handleSubmit() {
  submitting.value = true;
  clearErrors();

  const result = saveEmployee(props.companyId, props.employeeId, form);

  submitting.value = false;

  if (!result.success) {
    Object.assign(errors, result.errors);

    return;
  }

  emit('saved', result.employee);
}

watch(
  () => [props.open, props.employeeId, props.companyId],
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <AppModal
    :open="props.open"
    :title="modalTitle"
    size="large"
    @close="emit('close')"
  >
    <form id="employee-form" class="grid gap-6" @submit.prevent="handleSubmit">
      <p
        v-if="errors.form"
        class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
      >
        {{ errors.form }}
      </p>

      <fieldset>
        <legend
          class="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted"
        >
          Personal information
        </legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="form.firstName"
            label="First name"
            :error="errors.firstName"
            required
          />
          <AppInput
            v-model="form.lastName"
            label="Last name"
            :error="errors.lastName"
            required
          />
          <AppInput
            v-model="form.email"
            label="Work email"
            type="email"
            :error="errors.email"
            required
          />
          <AppInput v-model="form.phone" label="Phone" type="tel" />
        </div>
      </fieldset>

      <fieldset>
        <legend
          class="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted"
        >
          Employment
        </legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="form.jobTitle"
            label="Job title"
            :error="errors.jobTitle"
            required
          />
          <AppInput
            v-model="form.location"
            label="Location"
            :error="errors.location"
            required
          />
          <AppInput
            v-model="form.startDate"
            label="Start date"
            type="date"
            :error="errors.startDate"
            required
          />
          <AppInput
            v-model="form.annualLeaveAllowance"
            label="Annual leave allowance"
            type="number"
            min="0"
            :error="errors.annualLeaveAllowance"
            required
          />
          <AppSelect
            v-model="form.employmentType"
            label="Employment type"
            :options="options.employmentTypes"
            :error="errors.employmentType"
            required
          />
          <AppSelect
            v-model="form.status"
            label="Employment status"
            :options="options.statuses"
            :error="errors.status"
            required
          />
        </div>
      </fieldset>

      <fieldset>
        <legend
          class="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted"
        >
          Organization and access
        </legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppSelect
            v-model="form.teamId"
            label="Team"
            placeholder="Select a team"
            :options="options.teams"
            :error="errors.teamId"
            required
          />
          <AppSelect
            v-model="form.managerId"
            label="Manager"
            :options="options.managers"
            :error="errors.managerId"
          />
          <AppSelect
            v-model="form.role"
            label="System role"
            :options="options.roles"
            :error="errors.role"
            required
          />
        </div>
      </fieldset>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')"> Cancel </AppButton>
      <AppButton type="submit" form="employee-form" :disabled="submitting">
        {{ isEditing ? 'Save changes' : 'Add employee' }}
      </AppButton>
    </template>
  </AppModal>
</template>
