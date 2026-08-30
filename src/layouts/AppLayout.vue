<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../components/AppSidebar.vue';
import AppTopbar from '../components/AppTopbar.vue';

const route = useRoute();
const sidebarOpen = ref(false);
const currentYear = new Date().getFullYear();
let navigationTrigger = null;
let previousBodyOverflow = '';

const pageTitle = computed(() => route.meta.title || 'HR-Flow');

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
  <div
    class="h-dvh overflow-hidden bg-canvas lg:grid lg:grid-cols-[244px_minmax(0,1fr)]"
  >
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

    <div class="flex h-dvh min-w-0 flex-col overflow-hidden">
      <AppTopbar :title="pageTitle" @open-navigation="openNavigation" />
      <main
        id="main-content"
        class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-page"
        tabindex="-1"
      >
        <RouterView />
      </main>

      <footer
        class="shrink-0 border-t border-line bg-surface px-5 py-2 text-center text-xs text-subtle sm:px-page"
      >
        {{ currentYear }}. FIPU - Studij Informatike
      </footer>
    </div>
  </div>
</template>
