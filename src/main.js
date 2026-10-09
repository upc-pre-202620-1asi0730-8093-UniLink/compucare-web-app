
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import Aura from '@primeuix/themes/aura'

import App from './App.vue'
import router from './router/index.js'
import i18n from './i18n/index.js'

import './style.css'
import './shared/presentation/ui.css'

const app = createApp(App)

app.use(createPinia())

app.use(PrimeVue, {
    ripple: true,
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: false
        }
    }
})

app.use(ConfirmationService)
app.use(ToastService)

app.component('pv-dialog', Dialog)
app.component('pv-select', Select)
app.component('pv-textarea', Textarea)
app.component('pv-toast', Toast)
app.component('pv-confirm-dialog', ConfirmDialog)

app.use(i18n)
app.use(router)

app.mount('#app')
