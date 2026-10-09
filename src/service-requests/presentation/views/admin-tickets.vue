
<script setup>
import { computed, onMounted, ref } from 'vue'
import useTicketStore from '../../application/ticket.store.js'
import useIamStore from '../../../iam/application/iam.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'

const store = useTicketStore()
const iam = useIamStore()
const { ok, fail } = useFeedback()

const chosen = ref({})
const assigning = ref({})
const search = ref('')
const statusFilter = ref('Todos')
const loading = ref(false)

const statusOptions = [
  'Todos',
  'Pendiente de Asignación',
  'Asignado',
  'En Diagnóstico',
  'Resuelto',
  'Cancelado'
]

const tickets = computed(() => store.tickets || [])

const filteredTickets = computed(() => {
  const query = search.value.trim().toLowerCase()

  return tickets.value.filter(ticket => {
    const matchesStatus =
        statusFilter.value === 'Todos' ||
        ticket.status === statusFilter.value

    const matchesSearch =
        !query ||
        [
          ticket.id,
          ticket.employeeName,
          ticket.equipmentName,
          ticket.category,
          ticket.status,
          ticket.technicianName
        ].some(value =>
            String(value ?? '').toLowerCase().includes(query)
        )

    return matchesStatus && matchesSearch
  })
})

const pendingCount = computed(() =>
    tickets.value.filter(ticket =>
        ticket.status === 'Pendiente de Asignación'
    ).length
)

const activeCount = computed(() =>
    tickets.value.filter(ticket =>
        [
          'Asignado',
          'En Diagnóstico',
          'En Proceso'
        ].includes(ticket.status)
    ).length
)

const completedCount = computed(() =>
    tickets.value.filter(ticket =>
        [
          'Resuelto',
          'Completado',
          'Cerrado'
        ].includes(ticket.status)
    ).length
)

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      store.fetchTickets(),
      iam.fetchTechnicians()
    ])
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

async function assign(ticket) {
  const technicianId = chosen.value[ticket.id]

  if (!technicianId || assigning.value[ticket.id]) return

  assigning.value[ticket.id] = true

  try {
    await store.assignTicket(ticket.id, technicianId)
    ok('Técnico asignado y notificado correctamente')
  } catch (error) {
    fail(error)
  } finally {
    assigning.value[ticket.id] = false
  }
}

function statusClass(status) {
  const value = String(status || '').toLowerCase()

  if (value.includes('pendiente')) return 'status-pending'
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
  <main class="admin-page">
    <div class="page-container">

      <header class="page-header">
        <div class="header-content">
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            ADMINISTRACIÓN DE SOPORTE
          </div>

          <h1>Solicitudes de soporte</h1>

          <p>
            Supervisa las incidencias reportadas, consulta su estado
            y asigna técnicos para brindar atención oportuna.
          </p>
        </div>

        <div class="header-icon" aria-hidden="true">
          <i class="pi pi-clipboard"></i>
        </div>
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
          <span class="stat-caption">Tickets registrados</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>Por asignar</span>
            <span class="stat-icon pending-icon">
              <i class="pi pi-clock"></i>
            </span>
          </div>

          <strong>{{ pendingCount }}</strong>
          <span class="stat-caption">Requieren un técnico</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>En atención</span>
            <span class="stat-icon active-icon">
              <i class="pi pi-cog"></i>
            </span>
          </div>

          <strong>{{ activeCount }}</strong>
          <span class="stat-caption">Casos en seguimiento</span>
        </article>

        <article class="stat-card">
          <div class="stat-top">
            <span>Finalizadas</span>
            <span class="stat-icon completed-icon">
              <i class="pi pi-check-circle"></i>
            </span>
          </div>

          <strong>{{ completedCount }}</strong>
          <span class="stat-caption">Casos completados</span>
        </article>
      </section>

      <section class="tickets-card">
        <div class="section-heading">
          <div>
            <h2>Gestión de solicitudes</h2>
            <p>
              Consulta los tickets y administra las asignaciones.
            </p>
          </div>

          <div class="filters">
            <div class="search-box">
              <i class="pi pi-search"></i>

              <input
                  v-model="search"
                  type="search"
                  placeholder="Buscar solicitud..."
                  aria-label="Buscar solicitudes"
              />
            </div>

            <select
                v-model="statusFilter"
                class="status-filter"
                aria-label="Filtrar por estado"
            >
              <option
                  v-for="status in statusOptions"
                  :key="status"
                  :value="status"
              >
                {{ status }}
              </option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="tickets-table">
            <thead>
            <tr>
              <th>Ticket</th>
              <th>Solicitante</th>
              <th>Equipo</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Técnico asignado</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="6" class="empty-cell">
                Cargando solicitudes...
              </td>
            </tr>

            <tr v-else-if="filteredTickets.length === 0">
              <td colspan="6" class="empty-cell">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <strong>No hay solicitudes para mostrar</strong>
                  <span>
                      Prueba con otro filtro o término de búsqueda.
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
                <div class="person-cell">
                    <span class="person-avatar">
                      {{
                        (ticket.employeeName || 'U')
                            .charAt(0)
                            .toUpperCase()
                      }}
                    </span>

                  <span>
                      {{ ticket.employeeName || 'Usuario' }}
                    </span>
                </div>
              </td>

              <td>
                <div class="equipment-cell">
                  <i class="pi pi-desktop"></i>
                  {{ ticket.equipmentName || 'Sin identificar' }}
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
                <div
                    v-if="ticket.status === 'Pendiente de Asignación'"
                    class="assignment-control"
                >
                  <select
                      v-model="chosen[ticket.id]"
                      class="technician-select"
                      :aria-label="`Seleccionar técnico para ticket ${ticket.id}`"
                  >
                    <option :value="undefined" disabled>
                      Seleccionar técnico
                    </option>

                    <option
                        v-for="technician in iam.technicians"
                        :key="technician.id"
                        :value="technician.id"
                    >
                      {{ technician.name }}
                    </option>
                  </select>

                  <button
                      type="button"
                      class="assign-button"
                      :disabled="
                        !chosen[ticket.id] ||
                        assigning[ticket.id]
                      "
                      @click="assign(ticket)"
                  >
                    <i class="pi pi-check"></i>
                    {{ assigning[ticket.id] ? 'Asignando...' : 'Asignar' }}
                  </button>
                </div>

                <div v-else class="assigned-technician">
                  <i class="pi pi-user"></i>

                  <span>
                      {{ ticket.technicianName || 'Sin asignar' }}
                    </span>
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

          <span>
            {{ iam.technicians.length }} técnicos disponibles en el sistema
          </span>
        </div>
      </section>

      <footer class="page-footer">
        <span class="footer-brand">
          CompuCare<span>.</span>
        </span>

        <span>Powered by UniLink</span>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  padding: 38px 24px 24px;
  background:
      radial-gradient(
          circle at top right,
          rgba(199, 241, 200, 0.3),
          transparent 30%
      ),
      #f6f8f7;
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
  color: #112d35;
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
  flex-shrink: 0;
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
  min-width: 0;
  padding: 24px;
  background: #ffffff;
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
  color: #112d35;
  font-size: 19px;
  margin: 0 0 7px;
}

.section-heading p {
  color: #748487;
  font-size: 13px;
  margin: 0;
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  width: 245px;
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

.search-box input,
.status-filter {
  border: 1px solid #dce7e3;
  border-radius: 9px;
  color: #112d35;
  background: #fbfcfc;
  outline: none;
  font-size: 13px;
  box-sizing: border-box;
}

.search-box input {
  width: 100%;
  padding: 12px 12px 12px 39px;
}

.status-filter {
  max-width: 200px;
  padding: 12px;
  cursor: pointer;
}

.search-box input:focus,
.status-filter:focus,
.technician-select:focus {
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

.person-cell,
.equipment-cell,
.assigned-technician {
  display: flex;
  align-items: center;
  gap: 10px;
}

.person-cell {
  font-weight: 600;
}

.person-avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: #e7f5ee;
  color: #087f75;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
}

.equipment-cell i {
  color: #087f75;
  font-size: 16px;
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

.assignment-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.technician-select {
  min-width: 150px;
  max-width: 190px;
  padding: 10px;
  border: 1px solid #dce7e3;
  border-radius: 8px;
  background: #ffffff;
  color: #112d35;
  font-size: 12px;
  outline: none;
}

.assign-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 12px;
  background: #087f75;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.assign-button:hover:not(:disabled) {
  background: #066b63;
}

.assign-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.assigned-technician {
  color: #4e6365;
  font-size: 12px;
}

.assigned-technician i {
  color: #087f75;
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
  display: flex;
  justify-content: space-between;
  gap: 15px;
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

@media (max-width: 1150px) {
  .section-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .admin-page {
    padding: 24px 14px;
  }

  .page-header {
    align-items: flex-start;
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

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box,
  .status-filter {
    width: 100%;
    max-width: none;
  }

  .tickets-table th,
  .tickets-table td {
    padding: 15px 17px;
  }

  .table-footer {
    flex-direction: column;
  }

  .page-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
