<script setup>
const iconPaths = {
  home: ['M3 11.5 12 4l9 7.5', 'M5.5 10v10h13V10', 'M9.5 20v-6h5v6'],
  employees: [
    'M15 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 2 18.5V20',
    'M8.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
    'M17 11a3 3 0 1 0 0-6',
    'M22 20v-1.5a4.5 4.5 0 0 0-4-4.47',
  ],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 7v5l3 2'],
  calendar: [
    'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
    'M8 2v4',
    'M16 2v4',
    'M3 10h18',
  ],
  team: [
    'M15 20v-1a6 6 0 0 0-12 0v1',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    'M16 14a5 5 0 0 1 5 5v1',
    'M17 11a3 3 0 1 0 0-6',
  ],
  approvals: [
    'M6 3h12a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2',
    'M9 3.5h6v3H9z',
    'm8 14 2.5 2.5L16 11',
  ],
  bell: [
    'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9',
    'M10 21h4',
  ],
  settings: [
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
    'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34A1.7 1.7 0 0 0 14 20.93V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-1.55V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9c.18.61.74 1.03 1.37 1.03H21v4h-.09A1.7 1.7 0 0 0 19.4 15',
  ],
  inbox: ['M4 5h16v14H4z', 'M4 14h4l2 3h4l2-3h4'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
}

const props = defineProps({
  name: {
    type: String,
    required: true,
    validator: (value) =>
      ['home', 'employees', 'clock', 'calendar', 'team', 'approvals', 'bell', 'settings', 'inbox', 'close'].includes(value),
  },
  size: {
    type: [Number, String],
    default: 20,
  },
})
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="shrink-0"
  >
    <path v-for="path in iconPaths[props.name]" :key="path" :d="path" />
  </svg>
</template>
