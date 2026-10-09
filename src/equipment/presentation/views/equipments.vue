<script setup>
import { computed, onMounted, ref } from 'vue'
import useEquipmentStore from '../../application/equipment.store.js'
import useIamStore from '../../../iam/application/iam.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import { formatDate } from '../../../shared/presentation/format.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const store = useEquipmentStore()
const iam = useIamStore()
const { ok, fail } = useFeedback()

const types = ['Desktop', 'Laptop', 'Impresora', 'Servidor', 'Red', 'Otro']
const statuses = ['Operativo', 'En Reparación']

const isAdmin = computed(() => ['admin', 'company_manager'].includes(iam.role))

const loading = ref(false)
const saving = ref(false)
const search = ref('')
const typeFilter = ref(null)
const statusFilter = ref(null)
const locationFilter = ref(null)

const createVisible = ref(false)
const assignVisible = ref(false)
const historyVisible = ref(false)
const selected = ref(null)
const assignee = ref(null)

const form = ref({ name: '', serialNumber: '', type: null, locationId: null })

const equipments = computed(() => store.equipments || [])
const activeLocations = computed(() => store.locations.filter(l => l.active))

const locationOptions = computed(() =>
    store.locations.map(l => ({ id: l.id, label: `${l.name} · ${l.desk}` }))
)

const activeLocationOptions = computed(() =>
    activeLocations.value.map(l => ({ id: l.id, label: `${l.name} · ${l.desk}` }))
)

const filteredEquipments = computed(() => {
  const query = search.value.trim().toLowerCase()

  return equipments.value.filter(item => {
    if (typeFilter.value && item.type !== typeFilter.value) return false
    if (statusFilter.value && item.status !== statusFilter.value) return false
    if (locationFilter.value && item.locationId !== locationFilter.value) return false
    if (!query) return true

    return [item.code, item.name, item.serialNumber, item.type]
        .some(value => String(value ?? '').toLowerCase().includes(query))
  })
})

const operativeCount = computed(() =>
    equipments.value.filter(item => item.status === 'Operativo').length
)

const repairCount = computed(() =>
    equipments.value.filter(item => item.status === 'En Reparación').length
)

const unassignedCount = computed(() =>
    equipments.value.filter(item => !item.assignedTo).length
)

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      store.fetchEquipments(),
      store.fetchLocations(),
      isAdmin.value ? iam.fetchEmployees() : Promise.resolve()
    ])
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function locationLabel(id) {
  const location = store.locations.find(l => l.id === id)
  return location ? `${location.name} · ${location.desk}` : 'Sin sede'
}

function employeeName(id) {
  if (!id) return null
  return iam.employees.find(e => e.id === id)?.name ?? (id === iam.user?.id ? iam.user.name : `Empleado #${id}`)
}

function statusClass(status) {
  return status === 'En Reparación' ? 'cc-badge-pending' : 'cc-badge-done'
}

function openCreate() {
  form.value = { name: '', serialNumber: '', type: null, locationId: null }
  createVisible.value = true
}

async function saveEquipment() {
  if (saving.value) return

  if (!form.value.name.trim() || !form.value.serialNumber.trim() || !form.value.type) return

  saving.value = true

  try {
    await store.createEquipment({
      name: form.value.name.trim(),
      serialNumber: form.value.serialNumber.trim(),
      type: form.value.type,
      locationId: form.value.locationId || null
    })

    ok('Equipo registrado correctamente')
    createVisible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

function openAssign(item) {
  selected.value = item
  assignee.value = item.assignedTo ?? null
  assignVisible.value = true
}

async function saveAssignment(employeeId) {
  if (saving.value) return

  saving.value = true

  try {
    await store.assignEquipment(selected.value.id, employeeId)
    ok(employeeId ? 'Equipo asignado correctamente' : 'Asignación retirada')
    assignVisible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

async function openHistory(item) {
  selected.value = item
  store.history = null
  historyVisible.value = true

  try {
    await store.fetchHistory(item.id)
  } catch (error) {
    historyVisible.value = false
    fail(error)
  }
}
</script>

<template>
  <main class="cc-page">
    <div class="cc-container">

      <PageHeader
          :eyebrow="isAdmin ? 'INVENTARIO' : 'MIS EQUIPOS'"
          :title="isAdmin ? 'Equipos' : 'Mis equipos'"
          :description="isAdmin
            ? 'Registra los equipos de tu empresa, asígnalos a tu personal y consulta su historial de soporte.'
            : 'Consulta los equipos que tienes asignados y su estado actual.'"
      >
        <button
            v-if="isAdmin"
            class="cc-primary-btn"
            type="button"
            @click="openCreate"
        >
          <i class="pi pi-plus"></i>
          Registrar equipo
        </button>
      </PageHeader>

      <section class="cc-stats" aria-label="Resumen de equipos">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Total de equipos</span>
            <span class="cc-stat-icon"><i class="pi pi-desktop"></i></span>
          </div>
          <strong>{{ equipments.length }}</strong>
          <span class="cc-stat-caption">Equipos registrados</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Operativos</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-check-circle"></i></span>
          </div>
          <strong>{{ operativeCount }}</strong>
          <span class="cc-stat-caption">Funcionando con normalidad</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>En reparación</span>
            <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-wrench"></i></span>
          </div>
          <strong>{{ repairCount }}</strong>
          <span class="cc-stat-caption">Con soporte en curso</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ isAdmin ? 'Sin asignar' : 'Asignados a mí' }}</span>
            <span class="cc-stat-icon cc-icon-active"><i class="pi pi-user"></i></span>
          </div>
          <strong>{{ isAdmin ? unassignedCount : equipments.length }}</strong>
          <span class="cc-stat-caption">
            {{ isAdmin ? 'Disponibles para asignar' : 'Bajo tu responsabilidad' }}
          </span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>Listado de equipos</h2>
            <p>Filtra por tipo, estado o ubicación.</p>
          </div>

          <div class="cc-filters">
            <div class="cc-search">
              <i class="pi pi-search"></i>
              <input
                  v-model="search"
                  type="search"
                  placeholder="Buscar por código, nombre o serie..."
                  aria-label="Buscar equipos"
              />
            </div>

            <pv-select
                v-model="typeFilter"
                :options="types"
                placeholder="Tipo"
                show-clear
            />

            <pv-select
                v-model="statusFilter"
                :options="statuses"
                placeholder="Estado"
                show-clear
            />

            <pv-select
                v-if="isAdmin"
                v-model="locationFilter"
                :options="locationOptions"
                option-label="label"
                option-value="id"
                placeholder="Sede"
                show-clear
            />
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>Código</th>
              <th>Equipo</th>
              <th>N.º de serie</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th v-if="isAdmin">Asignado a</th>
              <th>Estado</th>
              <th v-if="isAdmin" class="cc-th-right">Acciones</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td :colspan="isAdmin ? 8 : 6" class="cc-empty-cell">
                Cargando equipos...
              </td>
            </tr>

            <tr v-else-if="filteredEquipments.length === 0">
              <td :colspan="isAdmin ? 8 : 6" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-desktop"></i>
                  <strong>No hay equipos para mostrar</strong>
                  <span>
                    {{ isAdmin
                      ? 'Registra un equipo o ajusta los filtros de búsqueda.'
                      : 'Cuando te asignen un equipo, aparecerá aquí.' }}
                  </span>
                </div>
              </td>
            </tr>

            <tr
                v-else
                v-for="item in filteredEquipments"
                :key="item.id"
            >
              <td><span class="cc-code">{{ item.code }}</span></td>

              <td>
                <div class="cc-cell">
                  <span class="cc-cell-icon">
                    <i :class="item.type === 'Laptop' ? 'pi pi-tablet' : 'pi pi-desktop'"></i>
                  </span>
                  <span>{{ item.name }}</span>
                </div>
              </td>

              <td>{{ item.serialNumber }}</td>
              <td>{{ item.type }}</td>
              <td>{{ locationLabel(item.locationId) }}</td>

              <td v-if="isAdmin">
                <span v-if="item.assignedTo">{{ employeeName(item.assignedTo) }}</span>
                <span v-else class="cc-muted">Sin asignar</span>
              </td>

              <td>
                <span class="cc-badge" :class="statusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>

              <td v-if="isAdmin">
                <div class="cc-actions">
                  <button
                      class="cc-icon-btn"
                      type="button"
                      title="Asignar equipo"
                      :aria-label="`Asignar ${item.name}`"
                      @click="openAssign(item)"
                  >
                    <i class="pi pi-user-edit"></i>
                  </button>

                  <button
                      class="cc-icon-btn"
                      type="button"
                      title="Ver historial"
                      :aria-label="`Ver historial de ${item.name}`"
                      @click="openHistory(item)"
                  >
                    <i class="pi pi-history"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="cc-table-footer">
          Mostrando {{ filteredEquipments.length }} de {{ equipments.length }} equipos
        </div>
      </section>

      <PageFooter />
    </div>

    <!-- Registrar equipo -->
    <pv-dialog
        v-model:visible="createVisible"
        header="Registrar equipo"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="saveEquipment">
        <p class="cc-dialog-desc">
          Ingresa los datos del equipo. El código interno se genera automáticamente.
        </p>

        <div class="cc-field">
          <label for="eq-name">Nombre del equipo</label>
          <input
              id="eq-name"
              v-model="form.name"
              class="cc-input"
              placeholder="Ej. Laptop Ventas"
              required
          />
        </div>

        <div class="cc-field">
          <label for="eq-serial">Número de serie</label>
          <input
              id="eq-serial"
              v-model="form.serialNumber"
              class="cc-input"
              placeholder="Ej. SN-1003"
              required
          />
        </div>

        <div class="cc-form-row">
          <div class="cc-field">
            <label for="eq-type">Tipo</label>
            <pv-select
                v-model="form.type"
                input-id="eq-type"
                :options="types"
                placeholder="Selecciona el tipo"
                class="cc-full"
            />
          </div>

          <div class="cc-field">
            <label for="eq-location">Sede (opcional)</label>
            <pv-select
                v-model="form.locationId"
                input-id="eq-location"
                :options="activeLocationOptions"
                option-label="label"
                option-value="id"
                placeholder="Selecciona la sede"
                class="cc-full"
                show-clear
            />
          </div>
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="createVisible = false">
            Cancelar
          </button>

          <button
              class="cc-primary-btn"
              type="submit"
              :disabled="saving || !form.type"
          >
            <i class="pi pi-save"></i>
            {{ saving ? 'Guardando...' : 'Guardar equipo' }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <!-- Asignar equipo -->
    <pv-dialog
        v-model:visible="assignVisible"
        :header="`Asignar ${selected?.name ?? 'equipo'}`"
        modal
        :style="{ width: 'min(460px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="saveAssignment(assignee)">
        <p class="cc-dialog-desc">
          Elige al empleado responsable. Cada cambio queda registrado en el historial del equipo.
        </p>

        <div class="cc-field">
          <label for="eq-assignee">Empleado</label>
          <pv-select
              v-model="assignee"
              input-id="eq-assignee"
              :options="iam.employees"
              option-label="name"
              option-value="id"
              placeholder="Selecciona un empleado"
              class="cc-full"
              filter
          />
        </div>

        <div class="cc-dialog-actions">
          <button
              v-if="selected?.assignedTo"
              class="cc-danger-btn"
              type="button"
              :disabled="saving"
              @click="saveAssignment(null)"
          >
            <i class="pi pi-user-minus"></i>
            Quitar asignación
          </button>

          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="assignVisible = false">
            Cancelar
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving || !assignee">
            <i class="pi pi-check"></i>
            {{ saving ? 'Guardando...' : 'Asignar' }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <!-- Historial del equipo -->
    <pv-dialog
        v-model:visible="historyVisible"
        :header="`Historial de ${selected?.name ?? 'equipo'}`"
        modal
        :style="{ width: 'min(560px, 94vw)' }"
    >
      <div v-if="!store.history" class="cc-timeline-empty">Cargando historial...</div>

      <div v-else class="cc-form">
        <div>
          <h3 class="cc-section-title">Asignaciones</h3>

          <div v-if="!store.history.assignments.length" class="cc-timeline-empty">
            Sin asignaciones registradas.
          </div>

          <div class="cc-timeline">
            <div
                v-for="item in store.history.assignments"
                :key="`a-${item.id}`"
                class="cc-timeline-item"
            >
              <span class="cc-timeline-dot"></span>
              <div class="cc-timeline-details">
                <strong>{{ item.employeeId ? `Asignado a ${employeeName(item.employeeId)}` : 'Asignación retirada' }}</strong>
                <small>{{ formatDate(item.at) }}</small>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="cc-section-title">Solicitudes de soporte</h3>

          <div v-if="!store.history.tickets.length" class="cc-timeline-empty">
            Sin solicitudes registradas.
          </div>

          <div class="cc-timeline">
            <div
                v-for="ticket in store.history.tickets"
                :key="`t-${ticket.id}`"
                class="cc-timeline-item"
            >
              <span class="cc-timeline-dot"></span>
              <div class="cc-timeline-details">
                <strong>#{{ ticket.id }} · {{ ticket.category }} · {{ ticket.status }}</strong>
                <small>{{ ticket.description }}</small>
                <small v-if="ticket.quotes?.length">
                  {{ ticket.quotes.length }} cotización(es) asociada(s)
                </small>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="cc-section-title">Mantenimientos preventivos</h3>

          <div v-if="!store.history.maintenances.length" class="cc-timeline-empty">
            Sin mantenimientos programados.
          </div>

          <div class="cc-timeline">
            <div
                v-for="item in store.history.maintenances"
                :key="`m-${item.id}`"
                class="cc-timeline-item"
            >
              <span class="cc-timeline-dot"></span>
              <div class="cc-timeline-details">
                <strong>{{ item.status }}</strong>
                <small>{{ formatDate(item.date, false) }} · {{ item.time }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </pv-dialog>
  </main>
</template>
