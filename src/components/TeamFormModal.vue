<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { saveTeam } from '../services/administrationService.js';
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
  team: {
    type: Object,
    default: null,
  },
  managerOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'saved']);
const form = reactive({ name: '', managerId: '' });
const errors = reactive({});
const submitting = ref(false);

const isEditing = computed(() => Boolean(props.team));
const modalTitle = computed(() =>
  isEditing.value ? 'Manage team' : 'Add team',
);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function resetForm() {
  Object.assign(form, {
    name: props.team?.name ?? '',
    managerId: props.team?.managerId ?? '',
  });
  clearErrors();
}

function handleSubmit() {
  submitting.value = true;
  clearErrors();

  const result = saveTeam(
    props.companyId,
    props.administratorUserId,
    props.team?.id ?? '',
    form,
  );

  submitting.value = false;

  if (!result.success) {
    Object.assign(errors, result.errors);

    return;
  }

  emit('saved', result.team);
}

watch(
  () => [props.open, props.team?.id],
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
    <form id="team-form" class="grid gap-5" @submit.prevent="handleSubmit">
      <p
        v-if="errors.form"
        class="border-l-2 border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
        role="alert"
      >
        {{ errors.form }}
      </p>

      <AppInput
        v-model="form.name"
        label="Team name"
        :error="errors.name"
        required
      />
      <AppSelect
        v-model="form.managerId"
        label="Team manager"
        :options="props.managerOptions"
        :error="errors.managerId"
      />
      <p class="text-xs leading-5 text-muted">
        Changing the manager also updates the manager assignment for current
        team members.
      </p>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')"> Cancel </AppButton>
      <AppButton type="submit" form="team-form" :disabled="submitting">
        {{ isEditing ? 'Save changes' : 'Add team' }}
      </AppButton>
    </template>
  </AppModal>
</template>
