<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import useIamStore from '../../application/iam.store.js'
import AuthLayout from '../../../shared/presentation/auth-layout.vue'

const router = useRouter()
const iam = useIamStore()
const { t } = useI18n({ useScope: 'global' })

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

    sentToken.value = import.meta.env.DEV ? (data.devToken ?? null) : null
    success.value = true
    message.value = t('auth.forgotSent')
  } catch (error) {
    message.value =
        error.response?.data?.message ||
        t('auth.forgotFailure')
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
    message.value = t('auth.resetSuccess')

    setTimeout(() => router.push('/login'), 1200)
  } catch (error) {
    message.value =
        error.response?.data?.message ||
        t('auth.resetFailure')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
      :title="t('auth.forgotTitle')"
      :subtitle="sentToken ? t('auth.forgotResetSubtitle') : t('auth.forgotRequestSubtitle')"
  >
    <form v-if="!sentToken" @submit.prevent="sendLink">
      <div class="cc-field" style="margin-bottom: 22px">
        <label for="forgot-email">{{ t('auth.email') }}</label>
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
        {{ loading ? t('auth.sending') : t('auth.sendLink') }}
      </button>
    </form>

    <form v-else @submit.prevent="reset">
      <div class="cc-banner cc-banner-info">
        <i class="pi pi-info-circle"></i>
        <span>{{ t('auth.demoToken') }} <strong style="word-break: break-all">{{ sentToken }}</strong></span>
      </div>

      <div class="cc-field" style="margin-bottom: 22px">
        <label for="reset-password">{{ t('auth.newPassword') }}</label>
        <input
            id="reset-password"
            v-model="newPassword"
            class="cc-input"
            type="password"
            minlength="6"
            :placeholder="t('auth.passwordMin')"
            autocomplete="new-password"
            :disabled="loading"
            required
        />
      </div>

      <button type="submit" class="cc-primary-btn cc-btn-block" :disabled="loading">
        {{ loading ? t('auth.updating') : t('auth.resetPassword') }}
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
      <router-link to="/login">{{ t('auth.backLogin') }}</router-link>
    </p>
  </AuthLayout>
</template>
