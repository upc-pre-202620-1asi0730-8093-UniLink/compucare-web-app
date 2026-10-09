<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useIamStore from '../../application/iam.store.js'
import useSubscriptionStore from '../../../subscriptions/application/subscription.store.js'
import AuthLayout from '../../../shared/presentation/auth-layout.vue'

const route = useRoute()
const router = useRouter()
const iam = useIamStore()
const subscriptions = useSubscriptionStore()

const form = ref({ companyName: '', ruc: '', name: '', email: '', password: '' })
const planId = ref(route.query.plan ? Number(route.query.plan) : null)
const card = ref({ holder: '', number: '', expiry: '', cvv: '' })

const message = ref('')
const registered = ref(false)
const loading = ref(false)

const plan = computed(() => subscriptions.plans.find(p => p.id === planId.value))

onMounted(() => subscriptions.fetchPlans().catch(() => {}))

async function submit() {
  if (loading.value) return

  message.value = ''
  registered.value = false
  loading.value = true

  try {
    const payload = {
      company: { name: form.value.companyName.trim(), ruc: form.value.ruc.trim() },
      admin: {
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        password: form.value.password
      }
    }

    if (planId.value) {
      // Pago simulado: solo se envía el titular y los últimos 4 dígitos
      payload.planId = planId.value
      payload.payment = {
        holder: card.value.holder.trim(),
        last4: card.value.number.replace(/\D/g, '').slice(-4)
      }
    }

    await iam.register(payload)

    registered.value = true
    message.value = 'Empresa registrada. Revisa tu correo de confirmación.'

    setTimeout(() => router.push('/login'), 1500)
  } catch (error) {
    message.value =
        error.response?.data?.message ||
        'No se pudo registrar la empresa. Inténtalo nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
      title="Registra tu empresa"
      subtitle="Crea la cuenta de administrador y empieza a gestionar el soporte técnico de tus equipos."
      headline="Soporte técnico para tu MYPE."
      text="Registra tu empresa, elige un plan y atiende tus incidencias con técnicos especializados."
      wide
  >
    <form class="cc-form" style="gap: 18px" @submit.prevent="submit">

      <div class="cc-field">
        <label for="company">Razón social</label>
        <input id="company" v-model="form.companyName" class="cc-input" :disabled="loading" required />
      </div>

      <div class="cc-field">
        <label for="ruc">RUC</label>
        <input
            id="ruc"
            v-model="form.ruc"
            class="cc-input"
            inputmode="numeric"
            maxlength="11"
            pattern="\d{11}"
            placeholder="11 dígitos"
            :disabled="loading"
            required
        />
      </div>

      <div class="cc-field">
        <label for="admin-name">Tu nombre</label>
        <input id="admin-name" v-model="form.name" class="cc-input" autocomplete="name" :disabled="loading" required />
      </div>

      <div class="cc-field">
        <label for="admin-email">Correo corporativo</label>
        <input
            id="admin-email"
            v-model="form.email"
            class="cc-input"
            type="email"
            placeholder="nombre@empresa.com"
            autocomplete="username"
            :disabled="loading"
            required
        />
      </div>

      <div class="cc-field">
        <label for="admin-password">Contraseña</label>
        <input
            id="admin-password"
            v-model="form.password"
            class="cc-input"
            type="password"
            minlength="6"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
            :disabled="loading"
            required
        />
      </div>

      <div class="cc-field">
        <label for="plan">Plan (opcional)</label>
        <pv-select
            v-model="planId"
            input-id="plan"
            :options="subscriptions.plans"
            option-label="name"
            option-value="id"
            placeholder="Elige un plan"
            class="cc-full"
            show-clear
        />
      </div>

      <template v-if="plan">
        <div class="cc-banner cc-banner-info" style="margin-bottom: 0">
          <i class="pi pi-info-circle"></i>
          <span>
            Plan {{ plan.name }}: S/ {{ plan.price }} al mes · {{ plan.hours }} h de soporte
            (pago simulado).
          </span>
        </div>

        <div class="cc-field">
          <label for="card-holder">Titular de la tarjeta de prueba</label>
          <input id="card-holder" v-model="card.holder" class="cc-input" :disabled="loading" required />
        </div>

        <div class="cc-field">
          <label for="card-number">Número de tarjeta de prueba</label>
          <input
              id="card-number"
              v-model="card.number"
              class="cc-input"
              inputmode="numeric"
              maxlength="16"
              :disabled="loading"
              required
          />
        </div>

        <div class="cc-form-row">
          <div class="cc-field">
            <label for="card-expiry">Vencimiento</label>
            <input id="card-expiry" v-model="card.expiry" class="cc-input" placeholder="MM/AA" :disabled="loading" required />
          </div>

          <div class="cc-field">
            <label for="card-cvv">CVV</label>
            <input id="card-cvv" v-model="card.cvv" class="cc-input" inputmode="numeric" maxlength="4" :disabled="loading" required />
          </div>
        </div>
      </template>

      <button type="submit" class="cc-primary-btn cc-btn-block" :disabled="loading">
        {{ loading ? 'Registrando...' : 'Registrar empresa' }}
      </button>

      <p
          v-if="message"
          class="cc-notice"
          :class="{ 'cc-notice-ok': registered }"
          style="margin-top: 0"
          :role="registered ? 'status' : 'alert'"
      >
        {{ message }}
      </p>

      <p style="margin: 4px 0 0; text-align: center; font-size: 13px; color: #66777a">
        ¿Ya tienes una cuenta? <router-link to="/login">Inicia sesión</router-link>
      </p>
    </form>
  </AuthLayout>
</template>
