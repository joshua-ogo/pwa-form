import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for offline support
registerSW({ immediate: true })

createApp(App).mount('#app')
