<script setup>
import { computed } from 'vue';
import BrandLogo from '../components/BrandLogo.vue';
import { useSessionStore } from '../stores/sessionStore.js';

const session = useSessionStore();
const returnRoute = computed(() =>
  session.isAuthenticated.value ? '/dashboard' : '/login',
);
const returnLabel = computed(() =>
  session.isAuthenticated.value ? 'Return to dashboard' : 'Return to sign in',
);
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-canvas p-5">
    <section class="w-full max-w-xl border border-line bg-surface p-6 sm:p-10">
      <BrandLogo :to="returnRoute" variant="dark" />
      <p
        class="mt-12 text-[11px] font-bold uppercase tracking-[0.14em] text-brand"
      >
        Error 404
      </p>
      <h1 class="mt-3">Page not found</h1>
      <p class="mt-3 max-w-md text-sm leading-6 text-muted">
        The requested HR-Flow page does not exist or is no longer available.
      </p>
      <RouterLink
        :to="returnRoute"
        class="mt-7 inline-flex min-h-9 items-center justify-center rounded-control border border-brand bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {{ returnLabel }}
      </RouterLink>
    </section>
  </main>
</template>
