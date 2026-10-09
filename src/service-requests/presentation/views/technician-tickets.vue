
<script setup>
import { computed, onMounted, ref } from 'vue'
import useTicketStore from '../../application/ticket.store.js'
import useQuotationStore from '../../../quotations/application/quotation.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'

const store = useTicketStore()
const quotes = useQuotationStore()
const { ok, fail } = useFeedback()

const loading = ref(false)
const processing = ref(false)
const search = ref('')

const closeVisible = ref(false)
const quoteVisible = ref(false)
const target = ref(null)

const report = ref({
  diagnosis: '',
  workDone: '',
  hours: 1
})

const items = ref([
  { description: '', cost: null }
])

const tickets = computed(() => store.tickets || [])

const filteredTickets = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return tickets.value

  return tickets.value.filter(ticket =>
      [
        ticket.id,
        ticket.equipmentName,
        ticket.description,
        ticket.status
      ].some(value =>
          String(value ?? '').toLowerCase().includes(query)
      )
  )
})

const assignedCount = computed(() =>
    tickets.value.filter(ticket =>
        ticket.status === 'Asignado'
    ).length
)

const diagnosisCount = computed(() =>
    tickets.value.filter(ticket =>
        ticket.status === 'En Diagnóstico'
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
      quotes.fetchQuotes()
    ])
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function quoteStatusOf(ticketId) {
  return (quotes.quotes || [])
      .filter(quote => quote.ticketId === ticketId)
      .map(quote => quote.status)
      .join(', ')
}

async function start(ticket) {
  if (processing.value) return

  processing.value = true

  try {
    await store.startDiagnosis(ticket.id)
    ok('Diagnóstico iniciado correctamente')
  } catch (error) {
    fail(error)
  } finally {
    processing.value = false
  }
}

function openClose(ticket) {
  target.value = ticket

  report.value = {
    diagnosis: '',
    workDone: '',
    hours: 1
  }

  closeVisible.value = true
}

async function close() {
  if (!target.value || processing.value) return

  if (
      !report.value.diagnosis.trim() ||
      !report.value.workDone.trim() ||
      Number(report.value.hours) <= 0
  ) {
    return
  }

  processing.value = true

  try {
    await store.closeTicket(target.value.id, {
      diagnosis: report.value.diagnosis.trim(),
      workDone: report.value.workDone.trim(),
      hours: Number(report.value.hours)
    })

    ok('Ticket atendido y horas registradas')
    closeVisible.value = false
    target.value = null
  } catch (error) {
    fail(error)
  } finally {
    processing.value = false
  }
}

function openQuote(ticket) {
  target.value = ticket
  items.value = [{ description: '', cost: null }]
  quoteVisible.value = true
}

function addItem() {
  items.value.push({
    description: '',
    cost: null
  })
}

function removeItem(index) {
  if (items.value.length > 1) {
    items.value.splice(index, 1)
  }
}

async function sendQuote() {
  if (!target.value || processing.value) return

  const valid = items.value.every(item =>
      item.description.trim() && Number(item.cost) > 0
  )

  if (!valid) return

  processing.value = true

  try {
    await quotes.createQuote({
      ticketId: target.value.id,
      items: items.value.map(item => ({
        description: item.description.trim(),
        cost: Number(item.cost)
      }))
    })

    ok('Cotización enviada para aprobación')
    quoteVisible.value = false
    target.value = null
  } catch (error) {
    fail(error)
  } finally {
    processing.value = false
  }
}

function statusClass(status) {
  const value = String(status || '').toLowerCase()

  if (value.includes('asignado')) return 'status-assigned'
  if (value.includes('diagnóstico')) return 'status-progress'
  if (value.includes('proceso')) return 'status-progress'
  if (value.includes('resuelto')) return 'status-completed'
  if (value.includes('completado')) return 'status-completed'
  if (value.includes('cerrado')) return 'status-completed'
  if (value.includes('cancelado')) return 'status-cancelled'

  return 'status-default'
}
</script>

<template>
  <main class="technician-page">
    <div class="page-container">

      <header class="page-header">
        <div class="header-content">
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            CENTRO DE SERVICIO TÉCNICO
          </div>

          <h1>Mis asignaciones</h1>

          <p>
            Consulta los equipos que requieren atención,
            registra diagnósticos y documenta los trabajos realizados.
          </p>
        </div>

        <div class="header-icon" aria-hidden="true">
          <i class="pi pi-wrench"></i>
        </div>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <div class="stat-top">
            <span>Total de tickets</span>
            <span class="stat-icon">
              <i class="pi pi-list"></i>
            </span>
          </div>

          <strong>{{ tickets.length }}</strong>
          <span class="stat-caption">Solicitudes disponibles</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>Asignados</span>
            <span class="stat-icon assigned-icon">
              <i class="pi pi-clipboard"></i>
            </span>
          </div>

          <strong>{{ assignedCount }}</strong>
          <span class="stat-caption">Pendientes de diagnóstico</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>En diagnóstico</span>
            <span class="stat-icon diagnosis-icon">
              <i class="pi pi-cog"></i>
            </span>
          </div>

          <strong>{{ diagnosisCount }}</strong>
          <span class="stat-caption">Trabajos en proceso</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>Finalizados</span>
            <span class="stat-icon completed-icon">
              <i class="pi pi-check-circle"></i>
            </span>
          </div>

          <strong>{{ completedCount }}</strong>
          <span class="stat-caption">Atenciones realizadas</span>
        </article>
      </section>

      <section class="tickets-card">
        <div class="section-heading">
          <div>
            <h2>Tickets asignados</h2>
            <p>Gestiona las intervenciones técnicas pendientes.</p>
          </div>

          <div class="search-box">
            <i class="pi pi-search"></i>

            <input
                v-model="search"
                type="search"
                placeholder="Buscar ticket..."
                aria-label="Buscar tickets"
            />
          </div>
        </div>

        <div class="table-container">
          <table class="tickets-table">
            <thead>
            <tr>
              <th>Ticket</th>
              <th>Equipo</th>
              <th>Descripción de la falla</th>
              <th>Estado</th>
              <th>Cotización</th>
              <th>Acciones</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="6" class="empty-cell">
                Cargando asignaciones...
              </td>
            </tr>

            <tr v-else-if="filteredTickets.length === 0">
              <td colspan="6" class="empty-cell">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <strong>No hay asignaciones para mostrar</strong>
                  <span>
                      Cuando tengas tickets asignados,
                      aparecerán aquí.
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
                  <span class="description-text">
                    {{ ticket.description || 'Sin descripción' }}
                  </span>
              </td>

              <td>
                <div class="status-cell">
                    <span
                        class="status-badge"
                        :class="statusClass(ticket.status)"
                    >
                      {{ ticket.status }}
                    </span>

                  <span
                      v-if="ticket.paused"
                      class="paused-badge"
                  >
                      Pausada
                    </span>
                </div>
              </td>

              <td>
                  <span
                      v-if="quoteStatusOf(ticket.id)"
                      class="quote-status"
                  >
                    {{ quoteStatusOf(ticket.id) }}
                  </span>

                <span v-else class="muted-text">
                    Sin cotización
                  </span>
              </td>

              <td>
                <div class="actions-cell">
                  <button
                      v-if="ticket.status === 'Asignado'"
                      class="action-button primary-action"
                      type="button"
                      :disabled="processing"
                      @click="start(ticket)"
                  >
                    <i class="pi pi-play"></i>
                    Iniciar diagnóstico
                  </button>

                  <template
                      v-if="['Asignado', 'En Diagnóstico'].includes(ticket.status)"
                  >
                    <button
                        class="action-button secondary-action"
                        type="button"
                        :disabled="processing"
                        @click="openQuote(ticket)"
                    >
                      <i class="pi pi-file-edit"></i>
                      Cotizar
                    </button>

                    <button
                        class="action-button complete-action"
                        type="button"
                        :disabled="processing"
                        @click="openClose(ticket)"
                    >
                      <i class="pi pi-check"></i>
                      Cerrar
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          Mostrando {{ filteredTickets.length }} de
          {{ tickets.length }} tickets
        </div>
      </section>

      <footer class="page-footer">
        <span class="footer-brand">
          CompuCare<span>.</span>
        </span>

        <span>Powered by UniLink</span>
      </footer>
    </div>

    <pv-dialog
        v-model:visible="closeVisible"
        header="Informe técnico"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <form class="dialog-form" @submit.prevent="close">
        <p class="dialog-description">
          Registra el diagnóstico, los trabajos realizados
          y el tiempo empleado.
        </p>

        <div class="form-field">
          <label for="diagnosis">Diagnóstico</label>

          <pv-textarea
              id="diagnosis"
              v-model="report.diagnosis"
              rows="3"
              placeholder="Describe el problema identificado"
              class="full-width"
              required
          />
        </div>

        <div class="form-field">
          <label for="work-done">Trabajo realizado</label>

          <pv-textarea
              id="work-done"
              v-model="report.workDone"
              rows="3"
              placeholder="Describe la solución aplicada"
              class="full-width"
              required
          />
        </div>

        <div class="form-field">
          <label for="hours">Horas empleadas</label>

          <input
              id="hours"
              v-model.number="report.hours"
              type="number"
              min="0.5"
              step="0.5"
              class="form-input"
              required
          />
        </div>

        <div class="dialog-actions">
          <button
              class="cancel-button"
              type="button"
              :disabled="processing"
              @click="closeVisible = false"
          >
            Cancelar
          </button>

          <button
              class="submit-button"
              type="submit"
              :disabled="processing"
          >
            {{ processing ? 'Registrando...' : 'Registrar y cerrar' }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <pv-dialog
        v-model:visible="quoteVisible"
        header="Cotización de repuestos"
        modal
        :style="{ width: 'min(540px, 94vw)' }"
    >
      <form class="dialog-form" @submit.prevent="sendQuote">
        <p class="dialog-description">
          Registra los repuestos necesarios
          y sus costos para solicitar aprobación.
        </p>

        <div
            v-for="(item, index) in items"
            :key="index"
            class="quote-item"
        >
          <div class="form-field">
            <label>Repuesto {{ index + 1 }}</label>

            <input
                v-model="item.description"
                type="text"
                placeholder="Nombre del repuesto"
                class="form-input"
                required
            />
          </div>

          <div class="form-field">
            <label>Costo (S/)</label>

            <input
                v-model.number="item.cost"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                class="form-input"
                required
            />
          </div>

          <button
              v-if="items.length > 1"
              class="remove-button"
              type="button"
              @click="removeItem(index)"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>

        <button
            class="add-button"
            type="button"
            @click="addItem"
        >
          <i class="pi pi-plus"></i>
          Agregar repuesto
        </button>

        <div class="dialog-actions">
          <button
              class="cancel-button"
              type="button"
              :disabled="processing"
              @click="quoteVisible = false"
          >
            Cancelar
          </button>

          <button
              class="submit-button"
              type="submit"
              :disabled="processing"
          >
            {{ processing ? 'Enviando...' : 'Enviar cotización' }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>

<style scoped>
.technician-page {
  min-height: 100vh;
  padding: 38px 24px 24px;
  background: #f6f8f7;
  color: #112d35;
  font-family: Arial, Helvetica, sans-serif;
}

.page-container {
  max-width: 1350px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}

.header-content {
  max-width: 710px;
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
  margin: 0 0 12px;
  font-size: clamp(29px, 4vw, 40px);
  font-weight: 800;
  letter-spacing: -1px;
}

.page-header p {
  color: #657679;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}

.header-icon {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  border-radius: 17px;
  background: #e5f4ec;
  color: #087f75;
  font-size: 27px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 24px;
  background: #fff;
  border: 1px solid #e4ece9;
  border-radius: 14px;
  min-width: 0;
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
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #087f75;
  background: #e7f5f1;
}

.assigned-icon {
  background: #e8f1ff;
  color: #3267ad;
}

.diagnosis-icon {
  background: #e9efff;
  color: #4951a2;
}

.completed-icon {
  background: #e3f5e9;
  color: #087f75;
}

.stat-card strong {
  display: block;
  font-size: 34px;
  margin-bottom: 7px;
}

.stat-caption {
  color: #7b8a8c;
  font-size: 12px;
}

.tickets-card {
  overflow: hidden;
  border-radius: 15px;
  background: #fff;
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
}

.search-box i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a999b;
}

.search-box input {
  width: 100%;
  padding: 12px 12px 12px 39px;
  border: 1px solid #dce7e3;
  border-radius: 9px;
  background: #fbfcfc;
  outline: none;
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
}

.tickets-table th {
  padding: 16px 20px;
  background: #f8faf9;
  color: #607275;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.tickets-table td {
  padding: 18px 20px;
  color: #344b51;
  font-size: 13px;
  border-bottom: 1px solid #f0f3f2;
  vertical-align: middle;
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
  border-radius: 8px;
  background: #eef5f2;
  color: #087f75;
}

.description-text {
  display: block;
  min-width: 160px;
  max-width: 280px;
  line-height: 1.6;
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.status-badge,
.paused-badge,
.quote-status {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
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

.status-cancelled,
.paused-badge {
  background: #fde9e7;
  color: #b6453d;
}

.status-default {
  background: #edf1f0;
  color: #53666a;
}

.quote-status {
  background: #eef5f2;
  color: #087f75;
}

.muted-text {
  color: #93a09f;
  font-size: 12px;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  min-width: 210px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  padding: 10px 11px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.primary-action,
.submit-button {
  background: #087f75;
  color: white;
}

.secondary-action {
  background: #e8f2ef;
  color: #087f75;
}

.complete-action {
  background: #e4f5e9;
  color: #167348;
}

.action-button:disabled,
.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
}

.empty-state i {
  font-size: 30px;
  color: #92b5a9;
}

.empty-state strong {
  font-size: 15px;
  color: #112d35;
}

.empty-state span {
  color: #839293;
  font-size: 13px;
}

.table-footer {
  padding: 17px 28px;
  color: #7a898b;
  font-size: 12px;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  padding: 30px 5px 10px;
  color: #80918f;
  font-size: 12px;
}

.footer-brand {
  font-size: 19px;
  font-weight: 800;
  color: #112d35;
}

.footer-brand span {
  color: #087f75;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 19px;
}

.dialog-description {
  margin: 0;
  color: #6e8080;
  font-size: 14px;
  line-height: 1.6;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.form-field label {
  font-size: 13px;
  font-weight: 700;
}

.full-width,
.form-input {
  width: 100%;
}

.form-input {
  padding: 13px;
  border: 1px solid #d5dfdd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #087f75;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.cancel-button,
.submit-button {
  padding: 13px 18px;
  border: none;
  border-radius: 9px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-button {
  background: #edf2f0;
  color: #465b5d;
}

.quote-item {
  display: flex;
  align-items: flex-end;
  gap: 9px;
}

.remove-button {
  padding: 12px;
  background: #fde9e7;
  color: #b6453d;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  align-self: flex-start;
  padding: 11px 13px;
  background: #e8f2ef;
  color: #087f75;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }
}

@media (max-width: 650px) {
  .technician-page {
    padding: 24px 14px;
  }

  .header-icon {
    display: none;
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

  .section-heading {
    padding: 22px 18px;
  }

  .tickets-table th,
  .tickets-table td {
    padding: 15px;
  }

  .quote-item {
    flex-wrap: wrap;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }
}
</style>
