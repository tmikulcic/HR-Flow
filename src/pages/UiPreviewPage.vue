<script setup>
import { ref } from 'vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import AppInput from '../components/AppInput.vue'
import AppModal from '../components/AppModal.vue'
import AppSelect from '../components/AppSelect.vue'
import Avatar from '../components/Avatar.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusBadge from '../components/StatusBadge.vue'

const name = ref('')
const role = ref('')
const modalOpen = ref(false)

const roleOptions = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'hr', label: 'HR staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
]

const iconNames = [
  'home',
  'employees',
  'clock',
  'calendar',
  'team',
  'approvals',
  'bell',
  'settings',
]
</script>

<template>
  <main class="min-h-screen bg-canvas p-6 sm:p-10">
    <div class="mx-auto grid max-w-5xl gap-8">
      <header>
        <h1>HR-Flow UI preview</h1>
        <p class="mt-2 text-muted">Reusable components used across the application.</p>
      </header>

      <section class="border border-line-strong bg-surface p-6">
        <h2 class="mb-5">Buttons</h2>
        <div class="flex flex-wrap gap-3">
          <AppButton>Primary</AppButton>
          <AppButton variant="secondary">Secondary</AppButton>
          <AppButton variant="danger">Danger</AppButton>
          <AppButton variant="ghost">Ghost</AppButton>
          <AppButton size="small">Small</AppButton>
          <AppButton disabled>Disabled</AppButton>
        </div>
      </section>

      <section class="grid gap-6 border border-line-strong bg-surface p-6 sm:grid-cols-2">
        <AppInput v-model="name" label="Employee name" placeholder="Enter a name" hint="Use the full name." />
        <AppInput label="Work email" model-value="invalid-email" error="Enter a valid email address." />
        <AppSelect
          v-model="role"
          label="System role"
          placeholder="Select a role"
          :options="roleOptions"
        />
      </section>

      <section class="border border-line-strong bg-surface p-6">
        <h2 class="mb-5">Statuses and avatars</h2>
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge>Neutral</StatusBadge>
          <StatusBadge tone="success">Active</StatusBadge>
          <StatusBadge tone="warning">Pending</StatusBadge>
          <StatusBadge tone="danger">Declined</StatusBadge>
          <StatusBadge tone="info">Invited</StatusBadge>
          <Avatar name="Olivia Carter" />
          <Avatar name="Daniel Kim" tone="info" size="large" />
        </div>
      </section>

      <section class="border border-line-strong bg-surface p-6">
        <h2 class="mb-5">Icons</h2>
        <div class="flex flex-wrap gap-5 text-brand">
          <AppIcon v-for="icon in iconNames" :key="icon" :name="icon" />
        </div>
      </section>

      <EmptyState
        title="No employees found"
        description="Try changing the current search or filters."
        icon="employees"
      >
        <template #action>
          <AppButton @click="modalOpen = true">Open modal</AppButton>
        </template>
      </EmptyState>
    </div>

    <AppModal :open="modalOpen" title="Example modal" @close="modalOpen = false">
      <p class="text-muted">This modal will later be reused for simple forms and confirmations.</p>
      <template #footer>
        <AppButton variant="secondary" @click="modalOpen = false">Cancel</AppButton>
        <AppButton @click="modalOpen = false">Confirm</AppButton>
      </template>
    </AppModal>
  </main>
</template>
