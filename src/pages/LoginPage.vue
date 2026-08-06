<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import AppInput from '../components/AppInput.vue';
import BrandLogo from '../components/BrandLogo.vue';
import {
  DEMO_CREDENTIALS,
  getDemoAccounts,
  signInWithCredentials,
} from '../services/authService.js';

const route = useRoute();
const router = useRouter();
const demoAccounts = getDemoAccounts();

const email = ref(DEMO_CREDENTIALS.email);
const password = ref('');
const rememberMe = ref(true);
const formMessage = ref('');
const formMessageType = ref('error');

const errors = reactive({
  email: '',
  password: '',
});

function validateForm() {
  errors.email = '';
  errors.password = '';
  formMessage.value = '';

  if (!email.value.trim()) {
    errors.email = 'Work email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Enter a valid work email.';
  }

  if (!password.value) {
    errors.password = 'Password is required.';
  }

  return !errors.email && !errors.password;
}

function getRedirectPath() {
  const redirect = route.query.redirect;

  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//')
  ) {
    return redirect;
  }

  return '/dashboard';
}

function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  const result = signInWithCredentials(
    email.value,
    password.value,
    rememberMe.value,
  );

  if (!result.success) {
    formMessageType.value = 'error';
    formMessage.value = result.error;

    return;
  }

  router.replace(getRedirectPath());
}

function handleForgotPassword() {
  formMessageType.value = 'info';
  formMessage.value =
    'Password reset will be available after Firebase is connected.';
}
</script>

<template>
  <main
    class="grid min-h-screen bg-surface lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]"
  >
    <section
      class="flex min-h-screen items-center px-6 py-10 sm:px-12 lg:px-16"
    >
      <div class="mx-auto w-full max-w-[420px]">
        <BrandLogo to="/login" variant="dark" />

        <div class="mt-14 border-b border-line pb-8">
          <p
            class="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand"
          >
            People operations
          </p>
          <h1>Welcome back</h1>
          <p class="mt-3 max-w-sm text-sm text-muted">
            Sign in to manage your people, time and leave in one place.
          </p>
        </div>

        <form class="mt-8 grid gap-5" novalidate @submit.prevent="handleSubmit">
          <AppInput
            v-model="email"
            label="Work email"
            type="email"
            autocomplete="email"
            placeholder="name@company.com"
            :error="errors.email"
            required
          />

          <AppInput
            v-model="password"
            label="Password"
            type="password"
            autocomplete="current-password"
            placeholder="Enter your password"
            :error="errors.password"
            required
          />

          <div class="flex items-center justify-between gap-4">
            <label
              class="inline-flex cursor-pointer items-center gap-2.5 text-xs font-medium text-muted"
            >
              <input
                v-model="rememberMe"
                type="checkbox"
                class="peer sr-only"
              />
              <span
                class="grid size-[18px] shrink-0 place-items-center rounded-badge border border-line-strong bg-surface text-transparent transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-brand/20"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 12 10"
                  class="size-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m1 5 3 3 7-7" />
                </svg>
              </span>
              <span>Remember me</span>
            </label>

            <button
              type="button"
              class="text-xs font-semibold text-brand hover:text-brand-dark"
              @click="handleForgotPassword"
            >
              Forgot password?
            </button>
          </div>

          <p
            v-if="formMessage"
            role="alert"
            :class="[
              'border-l-2 px-3 py-2 text-xs',
              formMessageType === 'error'
                ? 'border-danger bg-danger-soft text-danger'
                : 'border-info bg-info-soft text-info',
            ]"
          >
            {{ formMessage }}
          </p>

          <AppButton type="submit" class="mt-1 w-full"> Sign in </AppButton>
        </form>

        <div class="mt-8 border-t border-line pt-5 text-xs text-muted">
          <p class="font-semibold text-ink">Demo accounts</p>
          <p class="mt-1">Use password: {{ DEMO_CREDENTIALS.password }}</p>
          <div class="mt-3 grid gap-1.5">
            <button
              v-for="account in demoAccounts"
              :key="account.email"
              type="button"
              class="flex items-center justify-between gap-4 text-left hover:text-brand"
              @click="email = account.email"
            >
              <span>{{ account.email }}</span>
              <span class="text-subtle">{{ account.role }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section
      class="relative hidden min-h-screen overflow-hidden bg-sidebar px-16 py-14 text-white lg:flex lg:flex-col lg:justify-between"
      aria-label="HR-Flow introduction"
    >
      <div
        class="absolute inset-0 opacity-20"
        aria-hidden="true"
        style="
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.08) 1px,
              transparent 1px
            );
          background-size: 64px 64px;
        "
      />

      <div class="relative ml-auto h-12 w-36 border-t border-[#8ee0ca]/70">
        <span
          class="absolute right-0 top-[-4px] size-2 bg-[#8ee0ca]"
          aria-hidden="true"
        />
      </div>

      <div class="relative max-w-xl">
        <p
          class="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-[#8ee0ca]"
        >
          HR-Flow workspace
        </p>
        <h2
          class="max-w-lg text-[2.65rem] leading-[1.08] tracking-[-0.04em] text-white"
        >
          People operations without the busywork.
        </h2>
        <p class="mt-6 max-w-lg text-base leading-7 text-[#bdd2cc]">
          Give HR teams, managers and employees a shared source of truth for
          employee data, working time and leave.
        </p>
      </div>

      <div class="relative flex items-center gap-4 text-xs text-[#8fb1a9]">
        <span class="h-px w-16 bg-[#8ee0ca]/50" aria-hidden="true" />
        Northstar Labs · Internal workspace
      </div>
    </section>
  </main>
</template>
