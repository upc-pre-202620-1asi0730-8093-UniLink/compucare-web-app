
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue'
import useTicketStore from '../../application/ticket.store.js'
import useEquipmentStore from '../../../equipment/application/equipment.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'

const store = useTicketStore()
const equipment = useEquipmentStore()
const confirm = useConfirm()
const { ok, fail } = useFeedback()

const categories = [
  'Hardware',
  'Software',
  'Red',
  'Impresión',
  'Otro'
]

const visible = ref(false)
const timelineVisible = ref(false)
const selected = ref(null)
const loading = ref(false)
const saving = ref(false)
const search = ref('')

const form = ref({
  equipmentId: null,
  category: null,
  description: ''
})

const tickets = computed(() => store.tickets || [])

const filteredTickets = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return tickets.value

  return tickets.value.filter(ticket =>
      [
        ticket.id,
        ticket.equipmentName,
        ticket.category,
        ticket.status,
        ticket.description
      ]
          .some(value =>
              String(value ?? '').toLowerCase().includes(query)
          )
  )
})

const pendingCount = computed(() =>
    tickets.value.filter(ticket =>
        ticket.status === 'Pendiente de Asignación'
    ).length
)

const activeCount = computed(() =>
    tickets.value.filter(ticket =>
        ['Asignado', 'En Diagnóstico', 'En Proceso'].includes(ticket.status)
    ).length
)

const completedCount = computed(() =>
    tickets.value.filter(ticket =>
        ['Resuelto', 'Completado', 'Cerrado'].includes(ticket.status)
    ).length
)

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      store.fetchTickets(),
      equipment.fetchEquipments()
    ])

    if (equipment.equipments.length === 1) {
      form.value.equipmentId = equipment.equipments[0].id
    }
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function openReportDialog() {
  form.value = {
    equipmentId:
        equipment.equipments.length === 1
            ? equipment.equipments[0].id
            : null,
    category: null,
    description: ''
  }

  visible.value = true
}

async function save() {
  if (saving.value) return

  if (
      !form.value.equipmentId ||
      !form.value.category ||
      !form.value.description.trim()
  ) {
    return
  }

  saving.value = true

  try {
    await store.createTicket({
      equipmentId: form.value.equipmentId,
      category: form.value.category,
      description: form.value.description.trim()
    })

    ok('Solicitud enviada correctamente')
    visible.value = false

    form.value = {
      equipmentId: null,
      category: null,
      description: ''
    }
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

function openTimeline(ticket) {
  selected.value = ticket
  timelineVisible.value = true
}

function cancel(ticket) {
  confirm.require({
    header: 'Cancelar solicitud',
    message: `¿Deseas cancelar la solicitud #${ticket.id}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, cancelar',
    rejectLabel: 'Volver',
    accept: async () => {
      try {
        await store.cancelTicket(ticket.id)
        ok('Solicitud cancelada')
      } catch (error) {
        fail(error)
      }
    }
  })
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()

  if (normalized.includes('pendiente')) return 'status-pending'
  if (normalized.includes('asignado')) return 'status-assigned'
  if (normalized.includes('diagnóstico')) return 'status-progress'
  if (normalized.includes('proceso')) return 'status-progress'
  if (normalized.includes('resuelto')) return 'status-completed'
  if (normalized.includes('completado')) return 'status-completed'
  if (normalized.includes('cerrado')) return 'status-completed'
  if (normalized.includes('cancelado')) return 'status-cancelled'

  return 'status-default'
}

function formatDate(value) {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}
</script>

<template>
  <main class="tickets-page">
    <div class="page-container">

      <header class="page-header">
        <div class="header-content">
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            CENTRO DE SOPORTE
          </div>

          <h1>Mis solicitudes</h1>

          <p>
            Reporta incidencias, consulta tus solicitudes
            y mantente informado sobre el soporte de tus equipos.
          </p>
        </div>

        <button
            class="primary-button"
            type="button"
            @click="openReportDialog"
        >
          <i class="pi pi-plus"></i>
          Reportar falla
        </button>
      </header>

      <section class="stats-grid" aria-label="Resumen de solicitudes">
        <article class="stat-card">
          <div class="stat-top">
            <span>Total de solicitudes</span>
            <span class="stat-icon">
              <i class="pi pi-list"></i>
            </span>
          </div>

          <strong>{{ tickets.length }}</strong>
          <span class="stat-caption">Solicitudes registradas</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>Pendientes</span>
            <span class="stat-icon pending-icon">
              <i class="pi pi-clock"></i>
            </span>
          </div>

          <strong>{{ pendingCount }}</strong>
          <span class="stat-caption">Esperando asignación</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>En atención</span>
            <span class="stat-icon active-icon">
              <i class="pi pi-cog"></i>
            </span>
          </div>

          <strong>{{ activeCount }}</strong>
          <span class="stat-caption">Solicitudes en seguimiento</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>Finalizadas</span>
            <span class="stat-icon completed-icon">
              <i class="pi pi-check-circle"></i>
            </span>
          </div>

          <strong>{{ completedCount }}</strong>
          <span class="stat-caption">Solicitudes completadas</span>
        </article>
      </section>

      <section class="tickets-card">
        <div class="section-heading">
          <div>
            <h2>Historial de solicitudes</h2>
            <p>Consulta el estado de tus reportes técnicos.</p>
          </div>

          <div class="search-box">
            <i class="pi pi-search"></i>
            <input
                v-model="search"
                type="search"
                placeholder="Buscar solicitud..."
                aria-label="Buscar solicitudes"
            />
          </div>
        </div>

        <div class="table-container">
          <table class="tickets-table">
            <thead>
            <tr>
              <th>Ticket</th>
              <th>Equipo</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th class="actions-heading">Acciones</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="5" class="empty-cell">
                Cargando solicitudes...
              </td>
            </tr>

            <tr v-else-if="filteredTickets.length === 0">
              <td colspan="5" class="empty-cell">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <strong>No hay solicitudes para mostrar</strong>
                  <span>
                      Cuando registres una incidencia, aparecerá aquí.
                    </span>
                </div>
              </td>
            </tr>

            <tr
                v-else
                v-for="ticket in filteredTickets"
                :key="ticket.id"
            >
              <td>
                  <span class="ticket-code">
                    #{{ ticket.id }}
                  </span>
              </td>

              <td>
                <div class="equipment-cell">
                    <span class="equipment-icon">
                      <i class="pi pi-desktop"></i>
                    </span>

                  <span>
                      {{ ticket.equipmentName || 'Equipo registrado' }}
                    </span>
                </div>
              </td>

              <td>
                {{ ticket.category || 'Sin categoría' }}
              </td>

              <td>
                  <span
                      class="status-badge"
                      :class="statusClass(ticket.status)"
                  >
                    {{ ticket.status || 'Sin estado' }}
                  </span>
              </td>

              <td>
                <div class="actions-cell">
                  <button
                      class="icon-button"
                      type="button"
                      title="Ver seguimiento"
                      :aria-label="`Ver seguimiento del ticket ${ticket.id}`"
                      @click="openTimeline(ticket)"
                  >
                    <i class="pi pi-clock"></i>
                  </button>

                  <button
                      v-if="ticket.status === 'Pendiente de Asignación'"
                      class="icon-button danger-button"
                      type="button"
                      title="Cancelar solicitud"
                      :aria-label="`Cancelar ticket ${ticket.id}`"
                      @click="cancel(ticket)"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span>
            Mostrando {{ filteredTickets.length }} de
            {{ tickets.length }} solicitudes
          </span>
        </div>
      </section>

      <footer class="page-footer">
        <span class="footer-brand">CompuCare<span>.</span></span>
        <span>Powered by UniLink</span>
      </footer>
    </div>

    <!-- Formulario para reportar una falla -->
    <pv-dialog
        v-model:visible="visible"
        header="Reportar una falla"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <form class="report-form" @submit.prevent="save">
        <p class="dialog-description">
          Completa los datos del problema para solicitar
          asistencia técnica.
        </p>

        <div class="form-field">
          <label for="ticket-equipment">Equipo afectado</label>

          <pv-select
              v-model="form.equipmentId"
              input-id="ticket-equipment"
              :options="equipment.equipments"
              option-label="name"
              option-value="id"
              placeholder="Selecciona tu equipo"
              class="full-width"
              required
          />
        </div>

        <div class="form-field">
          <label for="ticket-category">Categoría</label>

          <pv-select
              v-model="form.category"
              input-id="ticket-category"
              :options="categories"
              placeholder="Selecciona una categoría"
              class="full-width"
              required
          />
        </div>

        <div class="form-field">
          <label for="ticket-description">
            Descripción del problema
          </label>

          <pv-textarea
              id="ticket-description"
              v-model="form.description"
              rows="5"
              placeholder="Describe qué sucede con tu equipo..."
              class="full-width"
              required
          />
        </div>

        <div class="dialog-actions">
          <button
              class="secondary-button"
              type="button"
              :disabled="saving"
              @click="visible = false"
          >
            Cancelar
          </button>

          <button
              class="primary-button"
              type="submit"
              :disabled="saving"
          >
            <i class="pi pi-send"></i>
            {{ saving ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <!-- Seguimiento de la solicitud -->
    <pv-dialog
        v-model:visible="timelineVisible"
        :header="`Seguimiento del ticket #${selected?.id ?? ''}`"
        modal
        :style="{ width: 'min(460px, 94vw)' }"
    >
      <div v-if="selected" class="timeline-content">
        <div
            v-if="!selected.timeline?.length"
            class="timeline-empty"
        >
          Aún no hay movimientos registrados.
        </div>

        <div
            v-for="(item, index) in selected.timeline || []"
            :key="index"
            class="timeline-item"
        >
          <span class="timeline-dot"></span>

          <div class="timeline-details">
            <strong>{{ item.status }}</strong>
            <small>{{ formatDate(item.at) }}</small>
          </div>
        </div>
      </div>
    </pv-dialog>
  </main>
</template>

<style scoped>
.tickets-page {
  min-height: 100vh;
  background:
      radial-gradient(
          circle at top right,
          rgba(199, 241, 200, 0.3),
          transparent 30%
      ),
      #f6f8f7;
  color: #112d35;
  font-family: Arial, Helvetica, sans-serif;
  padding: 38px 24px 24px;
}

.page-container {
  max-width: 1250px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 30px;
}

.header-content {
  max-width: 650px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #087f75;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 12px;
}

.eyebrow-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #087f75;
}

.page-header h1 {
  font-size: clamp(29px, 4vw, 40px);
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: -1px;
}

.page-header p {
  color: #657679;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}

.primary-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background: #087f75;
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.2s ease;
}

.primary-button:hover:not(:disabled) {
  background: #066b63;
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  min-width: 0;
  padding: 24px;
  background: #fff;
  border: 1px solid #e4ece9;
  border-radius: 14px;
  box-shadow: 0 5px 16px rgba(17, 45, 53, 0.035);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: #657679;
  font-size: 13px;
  font-weight: 600;
}

.stat-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #087f75;
  background: #e7f5f1;
  font-size: 17px;
}

.pending-icon {
  color: #bd8119;
  background: #fff5df;
}

.active-icon {
  color: #3267ad;
  background: #eaf2ff;
}

.completed-icon {
  color: #087f75;
  background: #e1f5e8;
}

.stat-card strong {
  display: block;
  color: #112d35;
  font-size: 34px;
  line-height: 1.15;
  margin-bottom: 7px;
}

.stat-caption {
  color: #7b8a8c;
  font-size: 12px;
}

.tickets-card {
  overflow: hidden;
  border-radius: 15px;
  background: #ffffff;
  border: 1px solid #e4ece9;
  box-shadow: 0 10px 30px rgba(17, 45, 53, 0.04);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 27px 28px;
  border-bottom: 1px solid #eaf0ed;
}

.section-heading h2 {
  font-size: 19px;
  margin: 0 0 7px;
  color: #112d35;
}

.section-heading p {
  color: #748487;
  font-size: 13px;
  margin: 0;
}

.search-box {
  position: relative;
  width: 270px;
  max-width: 100%;
  flex-shrink: 0;
}

.search-box i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a999b;
  font-size: 14px;
}

.search-box input {
  width: 100%;
  padding: 12px 12px 12px 39px;
  border: 1px solid #dce7e3;
  border-radius: 9px;
  color: #112d35;
  background: #fbfcfc;
  outline: none;
  font-size: 13px;
  box-sizing: border-box;
}

.search-box input:focus {
  border-color: #087f75;
  box-shadow: 0 0 0 3px rgba(8, 127, 117, 0.1);
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
}

.tickets-table th {
  padding: 16px 24px;
  background: #f8faf9;
  color: #607275;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #eaf0ed;
}

.tickets-table td {
  padding: 18px 24px;
  color: #344b51;
  font-size: 13px;
  border-bottom: 1px solid #f0f3f2;
}

.tickets-table tbody tr:hover {
  background: #fbfdfc;
}

.ticket-code {
  color: #087f75;
  font-weight: 800;
}

.equipment-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.equipment-icon {
  width: 33px;
  height: 33px;
  display: grid;
  place-items: center;
  background: #eef5f2;
  color: #087f75;
  border-radius: 8px;
}

.status-badge {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.status-pending {
  background: #fff4df;
  color: #9b6614;
}

.status-assigned {
  background: #e8f1ff;
  color: #3267ad;
}

.status-progress {
  background: #e9efff;
  color: #4951a2;
}

.status-completed {
  background: #e3f5e9;
  color: #087f75;
}

.status-cancelled {
  background: #fde9e7;
  color: #b6453d;
}

.status-default {
  background: #edf1f0;
  color: #53666a;
}

.actions-heading {
  text-align: right;
}

.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #087f75;
  cursor: pointer;
}

.icon-button:hover {
  background: #eaf5f1;
}

.danger-button {
  color: #c3514b;
}

.danger-button:hover {
  background: #fff0ef;
}

.empty-cell {
  padding: 55px 20px !important;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 11px;
  white-space: normal;
}

.empty-state i {
  font-size: 30px;
  color: #92b5a9;
  margin-bottom: 6px;
}

.empty-state strong {
  color: #112d35;
  font-size: 15px;
}

.empty-state span {
  color: #839293;
  font-size: 13px;
}

.table-footer {
  padding: 17px 28px;
  font-size: 12px;
  color: #7a898b;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 5px 10px;
  color: #80918f;
  font-size: 12px;
}

.footer-brand {
  color: #112d35;
  font-size: 19px;
  font-weight: 800;
}

.footer-brand span {
  color: #087f75;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-description {
  margin: 0;
  color: #6e8080;
  line-height: 1.6;
  font-size: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.form-field label {
  color: #112d35;
  font-size: 13px;
  font-weight: 700;
}

.full-width {
  width: 100%;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
}

.secondary-button {
  background: #edf2f0;
  color: #465b5d;
  border: none;
  padding: 13px 19px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.secondary-button:hover {
  background: #dfe9e5;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 10px 0;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  position: relative;
  padding-bottom: 28px;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 15px;
  bottom: 0;
  width: 2px;
  background: #cbe7db;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  background: #087f75;
  border: 3px solid #d7f0e5;
  border-radius: 50%;
}

.timeline-details {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.timeline-details strong {
  color: #112d35;
  font-size: 14px;
}

.timeline-details small {
  color: #82908f;
  font-size: 12px;
}

.timeline-empty {
  color: #7d8d8a;
  text-align: center;
  padding: 25px;
  font-size: 14px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .tickets-page {
    padding: 24px 14px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header .primary-button {
    width: 100%;
  }

  .stats-grid {
    gap: 11px;
  }

  .stat-card {
    padding: 17px;
  }

  .stat-card strong {
    font-size: 28px;
  }

  .stat-top {
    align-items: flex-start;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
    padding: 22px 18px;
  }

  .search-box {
    width: 100%;
  }

  .tickets-table th,
  .tickets-table td {
    padding: 15px 17px;
  }

  .page-footer {
    flex-direction: column;
    gap: 10px;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .dialog-actions button {
    width: 100%;
  }
}
</style>
