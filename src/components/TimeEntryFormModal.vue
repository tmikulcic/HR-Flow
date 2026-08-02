<script setup>
import { computed, reactive, ref, watch } from 'vue';
import {
  getTimeEntryFormData,
  saveTimeEntry,
} from '../services/timeEntryManagementService.js';
import AppButton from './AppButton.vue';
import AppInput from './AppInput.vue';
import AppModal from './AppModal.vue';

const props = defineProps({
  open: Boolean,
  companyId: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
  },
  entryId: {
    type: String,
    default: '',
  },
  initialDate: {
    type: String,
    default: '',
  },
  editing: Boolean,
});

const emit = defineEmits(['close', 'saved']);
const form = reactive({});
const errors = reactive({});
const submitting = ref(false);
const modalTitle = computed(() =>
  props.editing ? 'Edit time entry' : 'Add time entry',
);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function resetForm() {
  Object.assign(
    form,
    getTimeEntryFormData(
      props.companyId,
      props.employeeId,
      props.entryId,
      props.initialDate,
    ),
  );
  clearErrors();
}

function handleSubmit() {
  submitting.value = true;
  clearErrors();

  const result = saveTimeEntry(
    props.companyId,
    props.employeeId,
    props.entryId,
    form,
  );

  submitting.value = false;

  if (!result.success) {
    Object.assign(errors, result.errors);

    return;
  }

  emit('saved', result.entry);
}

watch(
  () => [
    props.open,
    props.companyId,
    props.employeeId,
    props.entryId,
    props.initialDate,
  ],
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <AppModal :open="props.open" :title="modalTitle" @close="emit('close')">
    <form
      id="time-entry-form"
      class="grid gap-5"
      @submit.prevent="handleSubmit"
    >
      <p
        v-if="errors.form"
        class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
      >
        {{ errors.form }}
      </p>

      <AppInput
        v-model="form.date"
        label="Work date"
        type="date"
        :error="errors.date"
        required
      />

      <div class="grid gap-4 sm:grid-cols-2">
        <AppInput
          v-model="form.startTime"
          label="Start time"
          type="time"
          :error="errors.startTime"
          required
        />
        <AppInput
          v-model="form.endTime"
          label="End time"
          type="time"
          :error="errors.endTime"
          required
        />
      </div>

      <AppInput
        v-model="form.breakMinutes"
        label="Break (minutes)"
        type="number"
        min="0"
        step="1"
        :error="errors.breakMinutes"
        required
      />
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton type="submit" form="time-entry-form" :disabled="submitting">
        {{ props.editing ? 'Save changes' : 'Add entry' }}
      </AppButton>
    </template>
  </AppModal>
</template>
