import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { initializeSession } from './stores/sessionStore.js';

async function bootstrapApplication() {
  await initializeSession();
  createApp(App).use(router).mount('#app');
}

void bootstrapApplication();
