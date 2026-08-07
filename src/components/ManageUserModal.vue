<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { updateUserAdministration } from '../services/administrationService.js';
import AppButton from './AppButton.vue';
import AppModal from './AppModal.vue';
import AppSelect from './AppSelect.vue';

const props = defineProps({
  open: Boolean,
  companyId: {
    type: String,
    required: true,
  },
  administratorUserId: {
    type: String,
    required: true,
  },
  user: {
    type: Object,
    default: null,
  },
  options: {
    type: Object,
    default: () => ({ roles: [], accessStatuses: [], teams: [] }),
  },
});

const emit = defineEmits(['close', 'saved']);
const form = reactive({
  role: '',
  accessStatus: '',
  teamId: '',
});
const errors = reactive({});
const submitting = ref(false);

const teamOptions = computed(() => [
  { value: '', label: 'Not assigned' },
  ...props.options.teams,
]);

const isOwnAccount = computed(
  () => props.user?.id === props.administratorUserId,
);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function resetForm() {
  Object.assign(form, {
    role: props.user?.role ?? '',
    accessStatus: props.user?.accessStatus ?? '',
    teamId: props.user?.teamId ?? '',
  });
  clearErrors();
}

function handleSubmit() {
  if (!props.user) {
    return;
  }

  submitting.value = true;
  clearErrors();

  const result = updateUserAdministration(
    props.companyId,
    props.administratorUserId,
    props.user.id,
    form,
  );

  submitting.value = false;

  if (!result.success) {
    Object.assign(errors, result.errors);

    return;
  }

  emit('saved', result.user);
}

watch(
  () => [props.open, props.user?.id],
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
    :title="props.user ? `Manage ${props.user.fullName}` : 'Manage user'"
    @close="emit('close')"
  >
    <form
      id="manage-user-form"
      class="grid gap-5"
      @submit.prevent="handleSubmit"
    >
      <div v-if="props.user" class="border-b border-line pb-4">
        <strong class="block text-sm">{{ props.user.email }}</strong>
        <p class="mt-1 text-xs text-muted">
          Changes apply to the next login and available navigation items.
        </p>
      </div>

      <p
        v-if="errors.form"
        class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
        role="alert"
      >
        {{ errors.form }}
      </p>

      <AppSelect
        v-model="form.role"
        label="System role"
        :options="props.options.roles"
        :error="errors.role"
        required
      />
      <AppSelect
        v-model="form.teamId"
        label="Team"
        :options="teamOptions"
        :error="errors.teamId"
      />
      <AppSelect
        v-model="form.accessStatus"
        label="Access status"
        :options="props.options.accessStatuses"
        :error="errors.accessStatus"
        required
      />

      <p v-if="isOwnAccount" class="text-xs leading-5 text-muted">
        Your own account must remain an active Administrator to prevent losing
        access to company settings.
      </p>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')"> Cancel </AppButton>
      <AppButton type="submit" form="manage-user-form" :disabled="submitting">
        Save changes
      </AppButton>
    </template>
  </AppModal>
</template>
