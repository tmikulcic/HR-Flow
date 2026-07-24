<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import AppTopbar from '../components/AppTopbar.vue'

const route = useRoute()
const sidebarOpen = ref(false)

const pageTitle = computed(() => route.meta.title || 'HR-Flow')
const pageSubtitle = computed(() => route.meta.subtitle || '')

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
    <AppSidebar
      :open="sidebarOpen"
      @close="sidebarOpen = false"
      @navigate="sidebarOpen = false"
    />

    <button
      v-if="sidebarOpen"
      type="button"
      class="fixed inset-0 z-30 bg-ink/55 lg:hidden"
      aria-label="Close navigation"
      @click="sidebarOpen = false"
    />

    <div class="min-w-0">
      <AppTopbar
        :title="pageTitle"
        :subtitle="pageSubtitle"
        @open-navigation="sidebarOpen = true"
      />
      <div class="p-5 sm:p-page">
        <RouterView />
      </div>
    </div>
  </div>
</template>
