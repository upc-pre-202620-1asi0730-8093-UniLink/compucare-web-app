<script setup>
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue'
import useSubscriptionStore from '../../application/subscription.store.js'
import useIamStore from '../../../iam/application/iam.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import { formatDate, formatMoney } from '../../../shared/presentation/format.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const store = useSubscriptionStore()
const iam = useIamStore()
const confirm = useConfirm()
const { ok, fail } = useFeedback()
const { t } = useI18n({ useScope: 'global' })

const loading = ref(false)
const saving = ref(false)
const billingVisible = ref(false)
const chosenPlan = ref(null)
const billing = ref({ name: '', email: '' })

const balance = computed(() => store.balance)
const percent = computed(() => Math.min(balance.value?.percentUsed ?? 0, 100))

const barClass = computed(() => {
  if (percent.value >= 90) return 'cc-critical'
  if (percent.value >= 80) return 'cc-warn'
  return ''
})

const currentPlan = computed(() =>
    store.plans.find(plan => plan.id === balance.value?.planId)
)

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([store.fetchPlans(), store.fetchBalance()])
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function openSubscribe(plan) {
  chosenPlan.value = plan
  billing.value = { name: iam.user?.name ?? '', email: iam.user?.email ?? '' }
  billingVisible.value = true
}

async function subscribe() {
  if (saving.value || !chosenPlan.value) return

  saving.value = true

  try {
    await store.subscribe(chosenPlan.value.id, {
      name: billing.value.name.trim(),
      email: billing.value.email.trim()
    })

    ok(t('screens.subscription.subscribed', { name: chosenPlan.value.name }))
    billingVisible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

function renew() {
  confirm.require({
    header: t('screens.subscription.renewTitle'),
    message: t('screens.subscription.renewQuestion'),
    icon: 'pi pi-refresh',
    acceptLabel: t('screens.subscription.confirmRenew'),
    rejectLabel: t('screens.subscription.back'),
    accept: async () => {
      try {
        await store.renew()
        ok(t('screens.subscription.renewed'))
      } catch (error) {
        fail(error)
      }
    }
  })
}
</script>

<template>
  <main class="cc-page">
    <div class="cc-container">

      <PageHeader
          :eyebrow="t('screens.subscription.s10')"
          :title="t('screens.subscription.s11')"
          :description="t('screens.subscription.s12')"
      >
        <button
            v-if="balance"
            class="cc-primary-btn"
            type="button"
            @click="renew"
        >
          <i class="pi pi-refresh"></i>
          {{ t('screens.subscription.s0') }}
        </button>
      </PageHeader>

      <div v-if="loading" class="cc-card">
        <div class="cc-card-body cc-muted">{{ t('screens.subscription.s1') }}</div>
      </div>

      <template v-else>
        <div v-if="!balance" class="cc-banner cc-banner-warn" role="status">
          <i class="pi pi-exclamation-triangle"></i>
          <span>
            {{ t('screens.subscription.s2') }}
          </span>
        </div>

        <div
            v-else-if="balance.percentUsed >= 80"
            class="cc-banner cc-banner-warn"
            role="alert"
        >
          <i class="pi pi-exclamation-triangle"></i>
          <span>
            {{ t('screens.subscription.usageAlert', { percent: balance.percentUsed }) }}
          </span>
        </div>

        <template v-if="balance">
          <section class="cc-stats" :aria-label="t('screens.subscription.s13')">
            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>{{ t('screens.subscription.s3') }}</span>
                <span class="cc-stat-icon"><i class="pi pi-star"></i></span>
              </div>
              <strong>{{ balance.planName }}</strong>
              <span class="cc-stat-caption">
                {{ currentPlan ? t('screens.subscription.perMonth', { price: formatMoney(currentPlan.price) }) : t('screens.subscription.activeSubscription') }}
              </span>
            </article>

            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>{{ t('screens.subscription.s4') }}</span>
                <span class="cc-stat-icon cc-icon-done"><i class="pi pi-clock"></i></span>
              </div>
              <strong>{{ balance.hoursRemaining }} h</strong>
              <span class="cc-stat-caption">{{ t('screens.subscription.includedHours', { total: balance.hoursTotal }) }}</span>
            </article>

            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>{{ t('screens.subscription.s5') }}</span>
                <span class="cc-stat-icon cc-icon-active"><i class="pi pi-calendar"></i></span>
              </div>
              <strong>{{ balance.preventiveRemaining }}</strong>
              <span class="cc-stat-caption">{{ t('screens.subscription.preventiveRemaining', { total: balance.preventiveTotal }) }}</span>
            </article>

            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>{{ t('screens.subscription.s6') }}</span>
                <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-refresh"></i></span>
              </div>
              <strong style="font-size: 22px">{{ formatDate(balance.renewsAt, false) }}</strong>
              <span class="cc-stat-caption">{{ t('screens.subscription.periodStart', { date: formatDate(balance.startedAt, false) }) }}</span>
            </article>
          </section>

          <section class="cc-card">
            <div class="cc-card-head">
              <div>
                <h2>{{ t('screens.subscription.s7') }}</h2>
                <p>{{ t('screens.subscription.hoursUsed', { used: balance.hoursUsed, total: balance.hoursTotal }) }}</p>
              </div>

              <span class="cc-badge" :class="balance.percentUsed >= 80 ? 'cc-badge-pending' : 'cc-badge-done'">
                {{ t('screens.subscription.percentageUsed', { percent: balance.percentUsed }) }}
              </span>
            </div>

            <div class="cc-card-body">
              <div
                  class="cc-progress"
                  role="progressbar"
                  :aria-label="t('screens.subscription.s14')"
                  :aria-valuenow="percent"
                  aria-valuemin="0"
                  aria-valuemax="100"
              >
                <div class="cc-progress-bar" :class="barClass" :style="{ width: `${percent}%` }"></div>
              </div>
            </div>
          </section>
        </template>

        <section class="cc-card">
          <div class="cc-card-head">
            <div>
              <h2>{{ t('screens.subscription.s8') }}</h2>
              <p>
                {{ t(balance ? 'screens.subscription.changePlan' : 'screens.subscription.choosePlan') }}
              </p>
            </div>
          </div>

          <div class="cc-card-body">
            <div class="cc-grid">
              <article
                  v-for="plan in store.plans"
                  :key="plan.id"
                  class="cc-stat"
                  :style="plan.id === balance?.planId ? 'border-color: #087f75; box-shadow: 0 0 0 3px rgba(8, 127, 117, 0.12)' : ''"
              >
                <div class="cc-stat-top">
                  <span>{{ plan.name }}</span>
                  <span v-if="plan.id === balance?.planId" class="cc-badge cc-badge-done">{{ t('screens.subscription.s3') }}</span>
                  <span v-else class="cc-stat-icon"><i class="pi pi-box"></i></span>
                </div>

                <strong>{{ formatMoney(plan.price) }}</strong>
                <span class="cc-stat-caption">por mes</span>

                <ul style="margin: 18px 0 22px; padding: 0; list-style: none; display: grid; gap: 10px; color: #344b51; font-size: 13px">
                  <li><i class="pi pi-check" style="color: #087f75; margin-right: 8px"></i>{{ plan.hours }} horas de soporte</li>
                  <li><i class="pi pi-check" style="color: #087f75; margin-right: 8px"></i>{{ plan.preventiveVisits }} visita(s) preventiva(s)</li>
                </ul>

                <button
                    class="cc-primary-btn cc-full"
                    type="button"
                    :disabled="plan.id === balance?.planId"
                    @click="openSubscribe(plan)"
                >
                  {{ t(plan.id === balance?.planId ? 'screens.subscription.planActive' : balance ? 'screens.subscription.changeToPlan' : 'screens.subscription.subscribe') }}
                </button>
              </article>
            </div>
          </div>
        </section>
      </template>

      <PageFooter />
    </div>

    <pv-dialog
        v-model:visible="billingVisible"
        :header="t('screens.subscription.planHeader', { name: chosenPlan?.name ?? '' })"
        modal
        :style="{ width: 'min(480px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="subscribe">
        <p class="cc-dialog-desc">
          {{ t('screens.subscription.billingDescription', { name: chosenPlan?.name, price: formatMoney(chosenPlan?.price) }) }}
        </p>

        <div class="cc-field">
          <label for="billing-name">{{ t('screens.subscription.billingName') }}</label>
          <input id="billing-name" v-model="billing.name" class="cc-input" required />
        </div>

        <div class="cc-field">
          <label for="billing-email">{{ t('screens.subscription.billingEmail') }}</label>
          <input id="billing-email" v-model="billing.email" class="cc-input" type="email" required />
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="billingVisible = false">
            {{ t('screens.subscription.s9') }}
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving">
            <i class="pi pi-check"></i>
            {{ saving ? t('screens.subscription.activating') : t('screens.subscription.confirmPlan') }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
