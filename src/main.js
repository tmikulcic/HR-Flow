import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { initializeLocalDatabase } from './repositories';
import { initializeSession } from './stores/sessionStore.js';

initializeLocalDatabase();
initializeSession();
createApp(App).use(router).mount('#app');
