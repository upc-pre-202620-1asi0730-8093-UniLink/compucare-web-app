<script setup>
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

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const form = ref({ date: '', time: '', equipmentIds: [] })

const maintenances = computed(() => store.maintenances || [])
const remaining = computed(() => store.balance?.preventiveRemaining ?? 0)
const canSchedule = computed(() => !!store.balance && remaining.value > 0)

const today = computed(() => new Date().toISOString().slice(0, 10))

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
      .map(id => equipment.equipments.find(e => e.id === id)?.name ?? `Equipo #${id}`)
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

  saving.value = true

  try {
    await store.scheduleMaintenance({
      date: form.value.date,
      time: form.value.time,
      equipmentIds: form.value.equipmentIds
    })

    ok('Mantenimiento preventivo agendado')
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
          eyebrow="MANTENIMIENTO PREVENTIVO"
          title="Mantenimientos"
          description="Agenda las visitas preventivas incluidas en tu plan y consulta las ya programadas."
      >
        <button
            class="cc-primary-btn"
            type="button"
            :disabled="!canSchedule"
            @click="openSchedule"
        >
          <i class="pi pi-calendar-plus"></i>
          Agendar visita
        </button>
      </PageHeader>

      <div v-if="!loading && !store.balance" class="cc-banner cc-banner-warn" role="status">
        <i class="pi pi-exclamation-triangle"></i>
        <span>Necesitas una suscripción activa para agendar mantenimientos preventivos.</span>
      </div>

      <div v-else-if="!loading && remaining === 0" class="cc-banner cc-banner-warn" role="status">
        <i class="pi pi-exclamation-triangle"></i>
        <span>Ya usaste todas las visitas preventivas de tu plan. Renueva tu suscripción para obtener más.</span>
      </div>

      <section class="cc-stats" aria-label="Resumen de mantenimientos">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Visitas disponibles</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-calendar"></i></span>
          </div>
          <strong>{{ remaining }}</strong>
          <span class="cc-stat-caption">Cupos preventivos restantes</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Visitas usadas</span>
            <span class="cc-stat-icon cc-icon-active"><i class="pi pi-check-square"></i></span>
          </div>
          <strong>{{ store.balance?.preventiveUsed ?? 0 }}</strong>
          <span class="cc-stat-caption">Del periodo actual</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Agendados</span>
            <span class="cc-stat-icon"><i class="pi pi-list"></i></span>
          </div>
          <strong>{{ maintenances.length }}</strong>
          <span class="cc-stat-caption">Mantenimientos registrados</span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>Visitas programadas</h2>
            <p>Cada visita consume un cupo preventivo de tu plan.</p>
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>Visita</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Equipos</th>
              <th>Estado</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="5" class="cc-empty-cell">Cargando mantenimientos...</td>
            </tr>

            <tr v-else-if="sortedMaintenances.length === 0">
              <td colspan="5" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-calendar"></i>
                  <strong>No hay visitas programadas</strong>
                  <span>Agenda tu primer mantenimiento preventivo.</span>
                </div>
              </td>
            </tr>

            <tr v-else v-for="item in sortedMaintenances" :key="item.id">
              <td><span class="cc-code">#{{ item.id }}</span></td>
              <td>{{ formatDate(`${item.date}T00:00:00`, false) }}</td>
              <td>{{ item.time }}</td>
              <td style="white-space: normal; min-width: 220px">{{ equipmentNames(item.equipmentIds) }}</td>
              <td><span class="cc-badge cc-badge-assigned">{{ item.status }}</span></td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="cc-table-footer">
          {{ sortedMaintenances.length }} visita(s) registrada(s)
        </div>
      </section>

      <PageFooter />
    </div>

    <pv-dialog
        v-model:visible="visible"
        header="Agendar mantenimiento preventivo"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="save">
        <p class="cc-dialog-desc">
          Elige la fecha, la hora y los equipos que revisará el técnico.
          Esta visita consumirá 1 de tus {{ remaining }} cupo(s) disponible(s).
        </p>

        <div class="cc-form-row">
          <div class="cc-field">
            <label for="m-date">Fecha</label>
            <input id="m-date" v-model="form.date" class="cc-input" type="date" :min="today" required />
          </div>

          <div class="cc-field">
            <label for="m-time">Hora</label>
            <input id="m-time" v-model="form.time" class="cc-input" type="time" required />
          </div>
        </div>

        <div class="cc-field">
          <label>Equipos a revisar</label>

          <div v-if="!equipment.equipments.length" class="cc-timeline-empty">
            No hay equipos registrados.
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
            Cancelar
          </button>

          <button
              class="cc-primary-btn"
              type="submit"
              :disabled="saving || !form.equipmentIds.length"
          >
            <i class="pi pi-calendar-plus"></i>
            {{ saving ? 'Agendando...' : 'Agendar visita' }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
