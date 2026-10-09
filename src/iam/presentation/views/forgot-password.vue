<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import useIamStore from '../../application/iam.store.js'
import AuthLayout from '../../../shared/presentation/auth-layout.vue'

const router = useRouter()
const iam = useIamStore()

const email = ref('')
const newPassword = ref('')
const sentToken = ref(null)   // En desarrollo se muestra el token que iría por correo
const message = ref('')
const success = ref(false)
const loading = ref(false)

async function sendLink() {
  if (loading.value) return

  message.value = ''
  success.value = false
  loading.value = true

  try {
    const data = await iam.forgotPassword(email.value.trim())

    sentToken.value = data.devToken
    success.value = true
    message.value = 'Enlace enviado. El token es válido por 24 horas.'
  } catch (error) {
    message.value =
        error.response?.data?.message ||
        'No se pudo enviar el enlace. Inténtalo nuevamente.'
  } finally {
    loading.value = false
  }
}

async function reset() {
  if (loading.value) return

  message.value = ''
  success.value = false
  loading.value = true

  try {
    await iam.resetPassword(sentToken.value, newPassword.value)

    success.value = true
    message.value = 'Contraseña actualizada. Redirigiendo al inicio de sesión...'

    setTimeout(() => router.push('/login'), 1200)
  } catch (error) {
    message.value =
        error.response?.data?.message ||
        'No se pudo actualizar la contraseña. Inténtalo nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
      title="Recuperar contraseña"
      :subtitle="sentToken
        ? 'Ingresa tu nueva contraseña para volver a acceder a CompuCare.'
        : 'Ingresa tu correo registrado y te enviaremos un enlace para restablecer tu contraseña.'"
  >
    <form v-if="!sentToken" @submit.prevent="sendLink">
      <div class="cc-field" style="margin-bottom: 22px">
        <label for="forgot-email">Correo electrónico</label>
        <input
            id="forgot-email"
            v-model="email"
            class="cc-input"
            type="email"
            placeholder="nombre@empresa.com"
            autocomplete="username"
            :disabled="loading"
            required
        />
      </div>

      <button type="submit" class="cc-primary-btn cc-btn-block" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Enviar enlace' }}
      </button>
    </form>

    <form v-else @submit.prevent="reset">
      <div class="cc-banner cc-banner-info">
        <i class="pi pi-info-circle"></i>
        <span>Correo simulado. Token (solo desarrollo): <strong style="word-break: break-all">{{ sentToken }}</strong></span>
      </div>

      <div class="cc-field" style="margin-bottom: 22px">
        <label for="reset-password">Nueva contraseña</label>
        <input
            id="reset-password"
            v-model="newPassword"
            class="cc-input"
            type="password"
            minlength="6"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
            :disabled="loading"
            required
        />
      </div>

      <button type="submit" class="cc-primary-btn cc-btn-block" :disabled="loading">
        {{ loading ? 'Actualizando...' : 'Restablecer contraseña' }}
      </button>
    </form>

    <p
        v-if="message"
        class="cc-notice"
        :class="{ 'cc-notice-ok': success }"
        :role="success ? 'status' : 'alert'"
    >
      {{ message }}
    </p>

    <p style="margin: 28px 0 0; text-align: center; font-size: 13px">
      <router-link to="/login">Volver a iniciar sesión</router-link>
    </p>
  </AuthLayout>
</template>
