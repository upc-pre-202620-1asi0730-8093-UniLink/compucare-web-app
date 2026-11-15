<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import useIamStore from '../../application/iam.store.js'
import useSubscriptionStore from '../../../subscriptions/application/subscription.store.js'
import AuthLayout from '../../../shared/presentation/auth-layout.vue'

const route = useRoute()
const router = useRouter()
const iam = useIamStore()
const subscriptions = useSubscriptionStore()
const { t } = useI18n({ useScope: 'global' })

const form = ref({ companyName: '', ruc: '', name: '', email: '', password: '' })
const planId = ref(route.query.plan ? Number(route.query.plan) : null)
const card = ref({ holder: '', last4: '' })

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
        last4: card.value.last4.trim()
      }
    }

    await iam.register(payload)

    registered.value = true
    message.value = t('auth.registered')

    setTimeout(() => router.push('/login'), 1500)
  } catch (error) {
    message.value =
        error.response?.data?.message ||
        t('auth.registerError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
      :title="t('auth.signupTitle')"
      :subtitle="t('auth.signupSubtitle')"
      :headline="t('auth.signupHeadline')"
      :text="t('auth.signupDescription')"
      wide
  >
    <form class="cc-form" style="gap: 18px" @submit.prevent="submit">

      <div class="cc-field">
        <label for="company">{{ t('auth.companyName') }}</label>
        <input id="company" v-model="form.companyName" class="cc-input" :disabled="loading" required />
      </div>

      <div class="cc-field">
        <label for="ruc">{{ t('auth.taxId') }}</label>
        <input
            id="ruc"
            v-model="form.ruc"
            class="cc-input"
            inputmode="numeric"
            maxlength="11"
            pattern="\d{11}"
            :placeholder="t('auth.taxIdHint')"
            :disabled="loading"
            required
        />
      </div>

      <div class="cc-field">
        <label for="admin-name">{{ t('auth.fullName') }}</label>
        <input id="admin-name" v-model="form.name" class="cc-input" autocomplete="name" :disabled="loading" required />
      </div>

      <div class="cc-field">
        <label for="admin-email">{{ t('auth.workEmail') }}</label>
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
        <label for="admin-password">{{ t('auth.password') }}</label>
        <input
            id="admin-password"
            v-model="form.password"
            class="cc-input"
            type="password"
            minlength="6"
            :placeholder="t('auth.passwordMin')"
            autocomplete="new-password"
            :disabled="loading"
            required
        />
      </div>

      <div class="cc-field">
        <label for="plan">{{ t('auth.choosePlan') }}</label>
        <pv-select
            v-model="planId"
            input-id="plan"
            :options="subscriptions.plans"
            option-label="name"
            option-value="id"
            :placeholder="t('auth.selectPlan')"
            class="cc-full"
            show-clear
        />
      </div>

      <template v-if="plan">
        <div class="cc-banner cc-banner-info" style="margin-bottom: 0">
          <i class="pi pi-info-circle"></i>
          <span>
            {{ t('auth.planDetail', { name: plan.name, price: plan.price, hours: plan.hours }) }}
          </span>
        </div>

        <div class="cc-field">
          <label for="card-holder">{{ t('auth.demoHolder') }}</label>
          <input id="card-holder" v-model="card.holder" class="cc-input" :disabled="loading" required />
        </div>

        <p class="cc-dialog-desc">{{ t('auth.demoPayment') }}</p>
        <div class="cc-field">
          <label for="card-last4">{{ t('auth.demoLast4') }}</label>
          <input
              id="card-last4"
              v-model="card.last4"
              class="cc-input"
              inputmode="numeric"
              pattern="[0-9]{4}"
              minlength="4"
              maxlength="4"
              autocomplete="off"
              placeholder="1234"
              :disabled="loading"
              required
          />
        </div>
      </template>

      <button type="submit" class="cc-primary-btn cc-btn-block" :disabled="loading">
        {{ loading ? t('auth.registering') : t('auth.register') }}
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
        {{ t('auth.alreadyHaveAccount') }} <router-link to="/login">{{ t('auth.signInLink') }}</router-link>
      </p>
    </form>
  </AuthLayout>
</template>
