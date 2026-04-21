<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Send 
} from 'lucide-vue-next'

// --- State ---
const isOnline = ref(navigator.onLine)
const isSubmitted = ref(false)
const errors = reactive({})

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  notes: ''
})

const savedData = ref(null)

// --- Logic ---
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

const validate = () => {
  errors.fullName = !form.fullName ? 'Full name is required' : ''
  errors.email = !form.email ? 'Email is required' : !/^\S+@\S+\.\S+$/.test(form.email) ? 'Invalid email format' : ''
  errors.phone = !form.phone ? 'Phone number is required' : ''
  
  return !errors.fullName && !errors.email && !errors.phone
}

const handleSubmit = () => {
  if (validate()) {
    // Save to localStorage
    const dataToSave = { ...form, timestamp: new Date().toISOString() }
    localStorage.setItem('intake_form_data', JSON.stringify(dataToSave))
    
    savedData.value = dataToSave
    isSubmitted.value = true
    
    // Smooth scroll to results
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }, 100)
  }
}

const resetForm = () => {
  isSubmitted.value = false
}

onMounted(() => {
  window.addEventListener('online', () => isOnline.value = true)
  window.addEventListener('offline', () => isOnline.value = false)
  
  // Load existing data
  const local = localStorage.getItem('intake_form_data')
  if (local) {
    savedData.value = JSON.parse(local)

  }
})

onUnmounted(() => {
  window.removeEventListener('online', () => isOnline.value = true)
  window.removeEventListener('offline', () => isOnline.value = false)
})
</script>

<template>
  <main>
    <!-- Online/Offline Indicator -->
    <div :class="['status-indicator', isOnline ? 'online' : 'offline']">
      <div class="dot"></div>
      <component :is="isOnline ? Wifi : WifiOff" size="16" />
      {{ isOnline ? 'Online' : 'Offline' }}
    </div>

    <!-- Header -->
    <div class="glass-card header-card">
      <h1>Intake Form</h1>
      <p class="subtitle">Please fill out your information below. Your data is saved locally and remains accessible offline.</p>
    </div>

    <!-- Intake Form -->
    <div class="glass-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label><User size="14" style="margin-right: 4px; vertical-align: middle;"/> Full Name</label>
          <input 
            v-model="form.fullName" 
            type="text" 
            placeholder="John Doe"
            :class="{ error: errors.fullName }"
          />
          <p v-if="errors.fullName" class="error-text">{{ errors.fullName }}</p>
        </div>

        <div class="form-group">
          <label><Mail size="14" style="margin-right: 4px; vertical-align: middle;"/> Email Address</label>
          <input 
            v-model="form.email" 
            type="email" 
            placeholder="john@example.com"
            :class="{ error: errors.email }"
          />
          <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
        </div>

        <div class="form-group">
          <label><Phone size="14" style="margin-right: 4px; vertical-align: middle;"/> Phone Number</label>
          <input 
            v-model="form.phone" 
            type="tel" 
            placeholder="+1 (555) 000-0000"
            :class="{ error: errors.phone }"
          />
          <p v-if="errors.phone" class="error-text">{{ errors.phone }}</p>
        </div>

        <div class="form-group">
          <label><MapPin size="14" style="margin-right: 4px; vertical-align: middle;"/> Address</label>
          <input 
            v-model="form.address" 
            type="text" 
            placeholder="123 Main St, City, Country"
          />
        </div>

        <div class="form-group">
          <label><FileText size="14" style="margin-right: 4px; vertical-align: middle;"/> Notes</label>
          <textarea 
            v-model="form.notes" 
            rows="4" 
            placeholder="Any additional information..."
          ></textarea>
        </div>

        <button type="submit">
          <Send size="18" style="margin-right: 8px; vertical-align: middle;"/>
          Submit Application
        </button>
      </form>
    </div>

    <!-- Submitted Data Card -->
    <div v-if="savedData" class="glass-card submitted-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <h2 style="margin: 0; color: var(--primary-dark);">Submitted Information</h2>
        <CheckCircle2 color="var(--success)" />
      </div>

      <div class="submitted-field">
        <div class="field-label">Full Name</div>
        <div class="field-value">{{ savedData.fullName }}</div>
      </div>

      <div class="submitted-field">
        <div class="field-label">Email Address</div>
        <div class="field-value">{{ savedData.email }}</div>
      </div>

      <div class="submitted-field">
        <div class="field-label">Phone Number</div>
        <div class="field-value">{{ savedData.phone }}</div>
      </div>

      <div v-if="savedData.address" class="submitted-field">
        <div class="field-label">Address</div>
        <div class="field-value">{{ savedData.address }}</div>
      </div>

      <div v-if="savedData.notes" class="submitted-field">
        <div class="field-label">Notes</div>
        <div class="field-value" style="white-space: pre-wrap;">{{ savedData.notes }}</div>
      </div>

      <div style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-muted); text-align: right;">
        Last updated: {{ new Date(savedData.timestamp).toLocaleString() }}
      </div>
    </div>
  </main>
</template>

<style scoped>
.header-card {
  text-align: center;
}
</style>
