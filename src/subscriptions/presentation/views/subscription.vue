<script setup>
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

    ok(`Suscripción al plan ${chosenPlan.value.name} activada`)
    billingVisible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

function renew() {
  confirm.require({
    header: 'Renovar suscripción',
    message: 'Se reiniciará tu bolsa de horas y tus visitas preventivas para un nuevo periodo. ¿Deseas continuar?',
    icon: 'pi pi-refresh',
    acceptLabel: 'Sí, renovar',
    rejectLabel: 'Volver',
    accept: async () => {
      try {
        await store.renew()
        ok('Suscripción renovada correctamente')
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
          eyebrow="SUSCRIPCIÓN"
          title="Plan y bolsa de horas"
          description="Controla el consumo de horas de soporte, tus visitas preventivas y la renovación de tu plan."
      >
        <button
            v-if="balance"
            class="cc-primary-btn"
            type="button"
            @click="renew"
        >
          <i class="pi pi-refresh"></i>
          Renovar suscripción
        </button>
      </PageHeader>

      <div v-if="loading" class="cc-card">
        <div class="cc-card-body cc-muted">Cargando suscripción...</div>
      </div>

      <template v-else>
        <div v-if="!balance" class="cc-banner cc-banner-warn" role="status">
          <i class="pi pi-exclamation-triangle"></i>
          <span>
            Tu empresa aún no tiene una suscripción activa.
            Elige un plan para empezar a solicitar soporte técnico.
          </span>
        </div>

        <div
            v-else-if="balance.percentUsed >= 80"
            class="cc-banner cc-banner-warn"
            role="alert"
        >
          <i class="pi pi-exclamation-triangle"></i>
          <span>
            Has consumido el {{ balance.percentUsed }}% de tu bolsa de horas.
            Evalúa renovar o cambiar a un plan superior.
          </span>
        </div>

        <template v-if="balance">
          <section class="cc-stats" aria-label="Resumen de la suscripción">
            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>Plan actual</span>
                <span class="cc-stat-icon"><i class="pi pi-star"></i></span>
              </div>
              <strong>{{ balance.planName }}</strong>
              <span class="cc-stat-caption">
                {{ currentPlan ? `${formatMoney(currentPlan.price)} al mes` : 'Suscripción activa' }}
              </span>
            </article>

            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>Horas restantes</span>
                <span class="cc-stat-icon cc-icon-done"><i class="pi pi-clock"></i></span>
              </div>
              <strong>{{ balance.hoursRemaining }} h</strong>
              <span class="cc-stat-caption">De {{ balance.hoursTotal }} h del periodo</span>
            </article>

            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>Visitas preventivas</span>
                <span class="cc-stat-icon cc-icon-active"><i class="pi pi-calendar"></i></span>
              </div>
              <strong>{{ balance.preventiveRemaining }}</strong>
              <span class="cc-stat-caption">De {{ balance.preventiveTotal }} disponibles</span>
            </article>

            <article class="cc-stat">
              <div class="cc-stat-top">
                <span>Próxima renovación</span>
                <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-refresh"></i></span>
              </div>
              <strong style="font-size: 22px">{{ formatDate(balance.renewsAt, false) }}</strong>
              <span class="cc-stat-caption">Inicio: {{ formatDate(balance.startedAt, false) }}</span>
            </article>
          </section>

          <section class="cc-card">
            <div class="cc-card-head">
              <div>
                <h2>Consumo de horas</h2>
                <p>{{ balance.hoursUsed }} h usadas de {{ balance.hoursTotal }} h</p>
              </div>

              <span class="cc-badge" :class="balance.percentUsed >= 80 ? 'cc-badge-pending' : 'cc-badge-done'">
                {{ balance.percentUsed }}% consumido
              </span>
            </div>

            <div class="cc-card-body">
              <div
                  class="cc-progress"
                  role="progressbar"
                  aria-label="Consumo de la bolsa de horas"
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
              <h2>Planes disponibles</h2>
              <p>
                {{ balance
                  ? 'Cambiar de plan reinicia tu bolsa de horas y tus visitas preventivas.'
                  : 'Selecciona el plan que mejor se adapte a tu empresa.' }}
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
                  <span v-if="plan.id === balance?.planId" class="cc-badge cc-badge-done">Plan actual</span>
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
                  {{ plan.id === balance?.planId
                    ? 'Plan activo'
                    : balance ? 'Cambiar a este plan' : 'Suscribirme' }}
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
        :header="`Plan ${chosenPlan?.name ?? ''}`"
        modal
        :style="{ width: 'min(480px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="subscribe">
        <p class="cc-dialog-desc">
          Confirma los datos de facturación para activar el plan
          {{ chosenPlan?.name }} ({{ formatMoney(chosenPlan?.price) }} al mes).
        </p>

        <div class="cc-field">
          <label for="billing-name">Nombre o razón social</label>
          <input id="billing-name" v-model="billing.name" class="cc-input" required />
        </div>

        <div class="cc-field">
          <label for="billing-email">Correo de facturación</label>
          <input id="billing-email" v-model="billing.email" class="cc-input" type="email" required />
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="billingVisible = false">
            Cancelar
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving">
            <i class="pi pi-check"></i>
            {{ saving ? 'Activando...' : 'Confirmar plan' }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
