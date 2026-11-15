<script setup>
import { useI18n } from 'vue-i18n'
import { useDomainLabels } from '../../../i18n/domain-labels.js'
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
const { t } = useI18n({ useScope: 'global' })
const { equipmentStatusLabel, ticketStatusLabel, categoryLabel } = useDomainLabels()

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
  return location ? `${location.name} · ${location.desk}` : t('screens.equipments.siteFallback')
}

function employeeName(id) {
  if (!id) return null
  return iam.employees.find(e => e.id === id)?.name ?? (id === iam.user?.id ? iam.user.name : `${t('screens.equipments.s26')} #${id}`)
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

    ok(t('screens.equipments.registered'))
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
    ok(t(employeeId ? 'screens.equipments.assigned' : 'screens.equipments.unassigned'))
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
          :eyebrow="isAdmin ? t('screens.equipments.adminEyebrow') : t('screens.equipments.employeeEyebrow')"
          :title="isAdmin ? t('screens.equipments.adminTitle') : t('screens.equipments.employeeTitle')"
          :description="isAdmin ? t('screens.equipments.adminDescription') : t('screens.equipments.employeeDescription')"
      >
        <button
            v-if="isAdmin"
            class="cc-primary-btn"
            type="button"
            @click="openCreate"
        >
          <i class="pi pi-plus"></i>
          {{ t('screens.equipments.s0') }}
        </button>
      </PageHeader>

      <section class="cc-stats" aria-label="Resumen de equipos">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.equipments.s1') }}</span>
            <span class="cc-stat-icon"><i class="pi pi-desktop"></i></span>
          </div>
          <strong>{{ equipments.length }}</strong>
          <span class="cc-stat-caption">{{ t('screens.equipments.s2') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.equipments.s3') }}</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-check-circle"></i></span>
          </div>
          <strong>{{ operativeCount }}</strong>
          <span class="cc-stat-caption">{{ t('screens.equipments.s4') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.equipments.s5') }}</span>
            <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-wrench"></i></span>
          </div>
          <strong>{{ repairCount }}</strong>
          <span class="cc-stat-caption">{{ t('screens.equipments.s6') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t(isAdmin ? 'screens.equipments.unassignedCount' : 'screens.equipments.mineCount') }}</span>
            <span class="cc-stat-icon cc-icon-active"><i class="pi pi-user"></i></span>
          </div>
          <strong>{{ isAdmin ? unassignedCount : equipments.length }}</strong>
          <span class="cc-stat-caption">
            {{ t(isAdmin ? 'screens.equipments.unassignedCaption' : 'screens.equipments.mineCaption') }}
          </span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>{{ t('screens.equipments.s7') }}</h2>
            <p>{{ t('screens.equipments.s8') }}</p>
          </div>

          <div class="cc-filters">
            <div class="cc-search">
              <i class="pi pi-search"></i>
              <input
                  v-model="search"
                  type="search"
                  :placeholder="t('screens.equipments.s35')"
                  :aria-label="t('screens.equipments.s36')"
              />
            </div>

            <pv-select
                v-model="typeFilter"
                :options="types"
                :placeholder="t('screens.equipments.s12')"
                show-clear
            />

            <pv-select
                v-model="statusFilter"
                :options="statuses"
                :placeholder="t('screens.equipments.s15')"
                show-clear
            />

            <pv-select
                v-if="isAdmin"
                v-model="locationFilter"
                :options="locationOptions"
                option-label="label"
                option-value="id"
                :placeholder="t('screens.equipments.s37')"
                show-clear
            />
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>{{ t('screens.equipments.s9') }}</th>
              <th>{{ t('screens.equipments.s10') }}</th>
              <th>{{ t('screens.equipments.s11') }}</th>
              <th>{{ t('screens.equipments.s12') }}</th>
              <th>{{ t('screens.equipments.s13') }}</th>
              <th v-if="isAdmin">{{ t('screens.equipments.s14') }}</th>
              <th>{{ t('screens.equipments.s15') }}</th>
              <th v-if="isAdmin" class="cc-th-right">{{ t('screens.equipments.s16') }}</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td :colspan="isAdmin ? 8 : 6" class="cc-empty-cell">
                {{ t('screens.equipments.s17') }}
              </td>
            </tr>

            <tr v-else-if="filteredEquipments.length === 0">
              <td :colspan="isAdmin ? 8 : 6" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-desktop"></i>
                  <strong>{{ t('screens.equipments.s18') }}</strong>
                  <span>
                    {{ t(isAdmin ? 'screens.equipments.noEquipmentAdmin' : 'screens.equipments.noEquipmentEmployee') }}
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
                <span v-else class="cc-muted">{{ t('screens.equipments.s19') }}</span>
              </td>

              <td>
                <span class="cc-badge" :class="statusClass(item.status)">
                  {{ equipmentStatusLabel(item.status) }}
                </span>
              </td>

              <td v-if="isAdmin">
                <div class="cc-actions">
                  <button
                      class="cc-icon-btn"
                      type="button"
                      :title="t('screens.equipments.s38')"
                      :aria-label="t('screens.equipments.assignAria', { name: item.name })"
                      @click="openAssign(item)"
                  >
                    <i class="pi pi-user-edit"></i>
                  </button>

                  <button
                      class="cc-icon-btn"
                      type="button"
                      :title="t('screens.equipments.s39')"
                      :aria-label="t('screens.equipments.historyAria', { name: item.name })"
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
          {{ t('screens.equipments.showing', { shown: filteredEquipments.length, total: equipments.length }) }}
        </div>
      </section>

      <PageFooter />
    </div>

    <!-- Registrar equipo -->
    <pv-dialog
        v-model:visible="createVisible"
        :header="t('screens.equipments.s0')"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="saveEquipment">
        <p class="cc-dialog-desc">
          {{ t('screens.equipments.s20') }}
        </p>

        <div class="cc-field">
          <label for="eq-name">{{ t('screens.equipments.s21') }}</label>
          <input
              id="eq-name"
              v-model="form.name"
              class="cc-input"
              :placeholder="t('screens.equipments.s40')"
              required
          />
        </div>

        <div class="cc-field">
          <label for="eq-serial">{{ t('screens.equipments.s22') }}</label>
          <input
              id="eq-serial"
              v-model="form.serialNumber"
              class="cc-input"
              :placeholder="t('screens.equipments.s41')"
              required
          />
        </div>

        <div class="cc-form-row">
          <div class="cc-field">
            <label for="eq-type">{{ t('screens.equipments.s12') }}</label>
            <pv-select
                v-model="form.type"
                input-id="eq-type"
                :options="types"
                :placeholder="t('screens.equipments.s42')"
                class="cc-full"
            />
          </div>

          <div class="cc-field">
            <label for="eq-location">{{ t('screens.equipments.s23') }}</label>
            <pv-select
                v-model="form.locationId"
                input-id="eq-location"
                :options="activeLocationOptions"
                option-label="label"
                option-value="id"
                :placeholder="t('screens.equipments.s43')"
                class="cc-full"
                show-clear
            />
          </div>
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="createVisible = false">
            {{ t('screens.equipments.s24') }}
          </button>

          <button
              class="cc-primary-btn"
              type="submit"
              :disabled="saving || !form.type"
          >
            <i class="pi pi-save"></i>
            {{ saving ? t('screens.equipments.saving') : t('screens.equipments.saveEquipment') }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <!-- Asignar equipo -->
    <pv-dialog
        v-model:visible="assignVisible"
        :header="t('screens.equipments.assignTitle', { name: selected?.name ?? t('screens.equipments.deviceFallback') })"
        modal
        :style="{ width: 'min(460px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="saveAssignment(assignee)">
        <p class="cc-dialog-desc">
          {{ t('screens.equipments.s25') }}
        </p>

        <div class="cc-field">
          <label for="eq-assignee">{{ t('screens.equipments.s26') }}</label>
          <pv-select
              v-model="assignee"
              input-id="eq-assignee"
              :options="iam.employees"
              option-label="name"
              option-value="id"
              :placeholder="t('screens.equipments.s44')"
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
            {{ t('screens.equipments.s27') }}
          </button>

          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="assignVisible = false">
            {{ t('screens.equipments.s24') }}
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving || !assignee">
            <i class="pi pi-check"></i>
            {{ saving ? t('screens.equipments.saving') : t('screens.equipments.assign') }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <!-- Historial del equipo -->
    <pv-dialog
        v-model:visible="historyVisible"
        :header="t('screens.equipments.historyTitle', { name: selected?.name ?? t('screens.equipments.deviceFallback') })"
        modal
        :style="{ width: 'min(560px, 94vw)' }"
    >
      <div v-if="!store.history" class="cc-timeline-empty">{{ t('screens.equipments.s28') }}</div>

      <div v-else class="cc-form">
        <div>
          <h3 class="cc-section-title">{{ t('screens.equipments.s29') }}</h3>

          <div v-if="!store.history.assignments.length" class="cc-timeline-empty">
            {{ t('screens.equipments.s30') }}
          </div>

          <div class="cc-timeline">
            <div
                v-for="item in store.history.assignments"
                :key="`a-${item.id}`"
                class="cc-timeline-item"
            >
              <span class="cc-timeline-dot"></span>
              <div class="cc-timeline-details">
                <strong>{{ item.employeeId ? t('screens.equipments.assignedTo', { name: employeeName(item.employeeId) }) : t('screens.equipments.removedAssignment') }}</strong>
                <small>{{ formatDate(item.at) }}</small>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="cc-section-title">{{ t('screens.equipments.s31') }}</h3>

          <div v-if="!store.history.tickets.length" class="cc-timeline-empty">
            {{ t('screens.equipments.s32') }}
          </div>

          <div class="cc-timeline">
            <div
                v-for="ticket in store.history.tickets"
                :key="`t-${ticket.id}`"
                class="cc-timeline-item"
            >
              <span class="cc-timeline-dot"></span>
              <div class="cc-timeline-details">
                <strong>#{{ ticket.id }} · {{ categoryLabel(ticket.category) }} · {{ ticketStatusLabel(ticket.status) }}</strong>
                <small>{{ ticket.description }}</small>
                <small v-if="ticket.quotes?.length">
                  {{ t('screens.equipments.quotesAssociated', { count: ticket.quotes.length }) }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="cc-section-title">{{ t('screens.equipments.s33') }}</h3>

          <div v-if="!store.history.maintenances.length" class="cc-timeline-empty">
            {{ t('screens.equipments.s34') }}
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
