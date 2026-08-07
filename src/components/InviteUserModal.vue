<script setup>
import { reactive, ref, watch } from 'vue';
import { USER_ROLES } from '../domain/index.js';
import { inviteUser } from '../services/administrationService.js';
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
  administratorUserId: {
    type: String,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({ roles: [], teams: [] }),
  },
});

const emit = defineEmits(['close', 'saved']);
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  role: USER_ROLES.EMPLOYEE,
  teamId: '',
});
const errors = reactive({});
const submitting = ref(false);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function resetForm() {
  Object.assign(form, {
    firstName: '',
    lastName: '',
    email: '',
    role: USER_ROLES.EMPLOYEE,
    teamId: props.options.teams[0]?.value ?? '',
  });
  clearErrors();
}

function handleSubmit() {
  submitting.value = true;
  clearErrors();

  const result = inviteUser(props.companyId, props.administratorUserId, form);

  submitting.value = false;

  if (!result.success) {
    Object.assign(errors, result.errors);

    return;
  }

  emit('saved', result.user);
}

watch(
  () => [props.open, props.companyId],
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <AppModal :open="props.open" title="Invite user" @close="emit('close')">
    <form
      id="invite-user-form"
      class="grid gap-5"
      @submit.prevent="handleSubmit"
    >
      <p class="text-sm text-muted">
        Create a local account with Invited access. The administrator can
        activate it later from the user list.
      </p>

      <p
        v-if="errors.form"
        class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
        role="alert"
      >
        {{ errors.form }}
      </p>

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
      </div>

      <AppInput
        v-model="form.email"
        label="Work email"
        type="email"
        :error="errors.email"
        required
      />

      <div class="grid gap-4 sm:grid-cols-2">
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
          placeholder="Select a team"
          :options="props.options.teams"
          :error="errors.teamId"
          required
        />
      </div>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')"> Cancel </AppButton>
      <AppButton type="submit" form="invite-user-form" :disabled="submitting">
        Send invite
      </AppButton>
    </template>
  </AppModal>
</template>
