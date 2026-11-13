<script setup>
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import useSubscriptionStore from '../../application/subscription.store.js'
import useEquipmentStore from '../../../equipment/application/equipment.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import { formatDate } from '../../../shared/presentation/format.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const store = useSubscriptionStore()
const equipment = useEquipmentStore()
const { ok, fail } = useFeedback()
const { t } = useI18n({ useScope: 'global' })

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const form = ref({ date: '', time: '', equipmentIds: [] })

const maintenances = computed(() => store.maintenances || [])
const remaining = computed(() => store.balance?.preventiveRemaining ?? 0)
const canSchedule = computed(() => !!store.balance && remaining.value > 0)

const today = computed(() => {
  const now = new Date()
  const two = value => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`
})

const sortedMaintenances = computed(() =>
    [...maintenances.value].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
)

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      store.fetchMaintenances(),
      store.fetchBalance(),
      equipment.fetchEquipments()
    ])
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function equipmentNames(ids) {
  return ids
      .map(id => equipment.equipments.find(e => e.id === id)?.name ?? t('screens.maintenances.equipmentFallback', { id }))
      .join(', ')
}

function openSchedule() {
  form.value = { date: '', time: '', equipmentIds: [] }
  visible.value = true
}

function toggleEquipment(id) {
  const ids = form.value.equipmentIds
  form.value.equipmentIds = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
}

async function save() {
  if (saving.value) return

  if (!form.value.date || !form.value.time || !form.value.equipmentIds.length) return
  if (form.value.date < today.value) {
    fail(new Error(t('screens.maintenances.invalidDate')))
    return
  }

  saving.value = true

  try {
    await store.scheduleMaintenance({
      date: form.value.date,
      time: form.value.time,
      equipmentIds: form.value.equipmentIds
    })

    ok(t('screens.maintenances.scheduled'))
    visible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="cc-page">
    <div class="cc-container">

      <PageHeader
          :eyebrow="t('screens.maintenances.s22')"
          :title="t('screens.maintenances.s23')"
          :description="t('screens.maintenances.s24')"
      >
        <button
            class="cc-primary-btn"
            type="button"
            :disabled="!canSchedule"
            @click="openSchedule"
        >
          <i class="pi pi-calendar-plus"></i>
          {{ t('screens.maintenances.s0') }}
        </button>
      </PageHeader>

      <div v-if="!loading && !store.balance" class="cc-banner cc-banner-warn" role="status">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ t('screens.maintenances.s1') }}</span>
      </div>

      <div v-else-if="!loading && remaining === 0" class="cc-banner cc-banner-warn" role="status">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ t('screens.maintenances.s2') }}</span>
      </div>

      <section class="cc-stats" :aria-label="t('screens.maintenances.s25')">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.maintenances.s3') }}</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-calendar"></i></span>
          </div>
          <strong>{{ remaining }}</strong>
          <span class="cc-stat-caption">{{ t('screens.maintenances.s4') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.maintenances.s5') }}</span>
            <span class="cc-stat-icon cc-icon-active"><i class="pi pi-check-square"></i></span>
          </div>
          <strong>{{ store.balance?.preventiveUsed ?? 0 }}</strong>
          <span class="cc-stat-caption">{{ t('screens.maintenances.s6') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.maintenances.s7') }}</span>
            <span class="cc-stat-icon"><i class="pi pi-list"></i></span>
          </div>
          <strong>{{ maintenances.length }}</strong>
          <span class="cc-stat-caption">{{ t('screens.maintenances.s8') }}</span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>{{ t('screens.maintenances.s9') }}</h2>
            <p>{{ t('screens.maintenances.s10') }}</p>
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>{{ t('screens.maintenances.s11') }}</th>
              <th>{{ t('screens.maintenances.s12') }}</th>
              <th>{{ t('screens.maintenances.s13') }}</th>
              <th>{{ t('screens.maintenances.s14') }}</th>
              <th>{{ t('screens.maintenances.s15') }}</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="5" class="cc-empty-cell">{{ t('screens.maintenances.s16') }}</td>
            </tr>

            <tr v-else-if="sortedMaintenances.length === 0">
              <td colspan="5" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-calendar"></i>
                  <strong>{{ t('screens.maintenances.s17') }}</strong>
                  <span>{{ t('screens.maintenances.s18') }}</span>
                </div>
              </td>
            </tr>

            <tr v-else v-for="item in sortedMaintenances" :key="item.id">
              <td><span class="cc-code">#{{ item.id }}</span></td>
              <td>{{ formatDate(`${item.date}T00:00:00`, false) }}</td>
              <td>{{ item.time }}</td>
              <td style="white-space: normal; min-width: 220px">{{ equipmentNames(item.equipmentIds) }}</td>
              <td><span class="cc-badge cc-badge-assigned">{{ item.status === 'Agendado' ? t('screens.maintenances.scheduledStatus') : item.status }}</span></td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="cc-table-footer">
          {{ t('screens.maintenances.scheduledCount', { count: sortedMaintenances.length }) }}
        </div>
      </section>

      <PageFooter />
    </div>

    <pv-dialog
        v-model:visible="visible"
        :header="t('screens.maintenances.s26')"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="save">
        <p class="cc-dialog-desc">
          {{ t('screens.maintenances.dateIntro', { remaining }) }}
        </p>

        <div class="cc-form-row">
          <div class="cc-field">
            <label for="m-date">{{ t('screens.maintenances.s12') }}</label>
            <input id="m-date" v-model="form.date" class="cc-input" type="date" :min="today" required />
          </div>

          <div class="cc-field">
            <label for="m-time">{{ t('screens.maintenances.s13') }}</label>
            <input id="m-time" v-model="form.time" class="cc-input" type="time" required />
          </div>
        </div>

        <div class="cc-field">
          <label>{{ t('screens.maintenances.s19') }}</label>

          <div v-if="!equipment.equipments.length" class="cc-timeline-empty">
            {{ t('screens.maintenances.s20') }}
          </div>

          <label
              v-for="item in equipment.equipments"
              :key="item.id"
              class="cc-cell"
              style="padding: 11px 13px; border: 1px solid #e4ece9; border-radius: 10px; cursor: pointer; font-weight: 600"
          >
            <input
                type="checkbox"
                :checked="form.equipmentIds.includes(item.id)"
                @change="toggleEquipment(item.id)"
            />
            <span class="cc-cell-icon"><i class="pi pi-desktop"></i></span>
            <span>{{ item.name }} <small class="cc-muted">· {{ item.code }}</small></span>
          </label>
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="visible = false">
            {{ t('screens.maintenances.s21') }}
          </button>

          <button
              class="cc-primary-btn"
              type="submit"
              :disabled="saving || !form.equipmentIds.length"
          >
            <i class="pi pi-calendar-plus"></i>
            {{ saving ? t('screens.maintenances.saving') : t('screens.maintenances.schedule') }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
