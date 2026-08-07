<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../components/AppSidebar.vue';
import AppTopbar from '../components/AppTopbar.vue';
import { useSessionStore } from '../stores/sessionStore.js';

const route = useRoute();
const session = useSessionStore();
const sidebarOpen = ref(false);
let navigationTrigger = null;
let previousBodyOverflow = '';

const pageTitle = computed(() => route.meta.title || 'HR-Flow');
const pageSubtitle = computed(() =>
  route.name === 'dashboard'
    ? (session.currentCompany.value?.name ?? '')
    : (route.meta.subtitle ?? ''),
);

function openNavigation(event) {
  navigationTrigger = event?.currentTarget ?? null;
  sidebarOpen.value = true;
}

function closeNavigation(restoreFocus = true) {
  sidebarOpen.value = false;

  if (restoreFocus) {
    nextTick(() => navigationTrigger?.focus());
  }
}

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false;
    navigationTrigger = null;
  },
);

watch(sidebarOpen, (open) => {
  if (open) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = previousBodyOverflow;
  }
});

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow;
});
</script>

<template>
  <div class="min-h-dvh bg-canvas lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
    <a
      href="#main-content"
      class="fixed left-4 top-4 z-[60] -translate-y-20 rounded-control bg-ink px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>

    <AppSidebar
      :open="sidebarOpen"
      @close="closeNavigation()"
      @navigate="closeNavigation(false)"
    />

    <button
      v-if="sidebarOpen"
      type="button"
      class="fixed inset-0 z-30 bg-ink/55 lg:hidden"
      aria-label="Close navigation"
      @click="closeNavigation()"
    />

    <div class="min-w-0">
      <AppTopbar
        :title="pageTitle"
        :subtitle="pageSubtitle"
        @open-navigation="openNavigation"
      />
      <div id="main-content" class="p-5 sm:p-page" tabindex="-1">
        <RouterView />
      </div>
    </div>
  </div>
</template>
