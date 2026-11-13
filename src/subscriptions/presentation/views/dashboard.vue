<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import useSubscriptionStore from '../../application/subscription.store.js'
import useEquipmentStore from '../../../equipment/application/equipment.store.js'
import useQuotationStore from '../../../quotations/application/quotation.store.js'
import useTicketStore from '../../../service-requests/application/ticket.store.js'
import useIamStore from '../../../iam/application/iam.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import { formatDate } from '../../../shared/presentation/format.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const router = useRouter()
const subscriptions = useSubscriptionStore()
const equipment = useEquipmentStore()
const quotations = useQuotationStore()
const tickets = useTicketStore()
const iam = useIamStore()
const { fail } = useFeedback()

const loading = ref(false)

const firstName = computed(() => (iam.user?.name ?? '').split(' ')[0])
const balance = computed(() => subscriptions.balance)

const openTickets = computed(() =>
    tickets.tickets.filter(t => ['Pendiente de Asignación', 'Asignado', 'En Diagnóstico'].includes(t.status))
)

const pendingQuotes = computed(() =>
    quotations.quotes.filter(q => q.status === 'PENDING')
)

const recentTickets = computed(() =>
    [...tickets.tickets]
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 5)
)

const shortcuts = [
  { label: 'Equipos', text: 'Inventario y asignaciones', icon: 'pi pi-desktop', path: '/equipments' },
  { label: 'Cotizaciones', text: 'Aprueba y paga', icon: 'pi pi-file', path: '/quotations' },
  { label: 'Mantenimientos', text: 'Agenda visitas preventivas', icon: 'pi pi-calendar', path: '/maintenances' }
]

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      subscriptions.fetchBalance(),
      equipment.fetchEquipments(),
      quotations.fetchQuotes(),
      tickets.fetchTickets()
    ])
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function statusClass(status) {
  const value = String(status || '').toLowerCase()

  if (value.includes('pendiente')) return 'cc-badge-pending'
  if (value.includes('asignado')) return 'cc-badge-assigned'
  if (value.includes('diagnóstico') || value.includes('proceso')) return 'cc-badge-progress'
  if (value.includes('cancelado')) return 'cc-badge-cancel'
  if (value.includes('atendido') || value.includes('resuelto') || value.includes('cerrado')) return 'cc-badge-done'

  return 'cc-badge-default'
}
</script>

<template>
  <main class="cc-page">
    <div class="cc-container">

      <PageHeader
          eyebrow="PANEL DE LA EMPRESA"
          :title="`Hola, ${firstName}`"
          description="Este es el resumen del soporte técnico de tu empresa: horas disponibles, equipos, tickets y cotizaciones."
      />

      <div
          v-if="balance && balance.percentUsed >= 80"
          class="cc-banner cc-banner-warn"
          role="alert"
      >
        <i class="pi pi-exclamation-triangle"></i>
        <span>
          Has consumido el {{ balance.percentUsed }}% de tu bolsa de horas.
          <router-link to="/subscription">Revisa tu plan</router-link>.
        </span>
      </div>

      <section class="cc-stats" aria-label="Resumen general">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Horas restantes</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-clock"></i></span>
          </div>
          <strong>{{ balance ? `${balance.hoursRemaining} h` : '—' }}</strong>
          <span class="cc-stat-caption">
            {{ balance ? `Plan ${balance.planName}` : 'Sin suscripción activa' }}
          </span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Equipos</span>
            <span class="cc-stat-icon"><i class="pi pi-desktop"></i></span>
          </div>
          <strong>{{ equipment.equipments.length }}</strong>
          <span class="cc-stat-caption">Equipos registrados</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Tickets abiertos</span>
            <span class="cc-stat-icon cc-icon-active"><i class="pi pi-ticket"></i></span>
          </div>
          <strong>{{ openTickets.length }}</strong>
          <span class="cc-stat-caption">En atención</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Cotizaciones pendientes</span>
            <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-file"></i></span>
          </div>
          <strong>{{ pendingQuotes.length }}</strong>
          <span class="cc-stat-caption">Esperan tu aprobación</span>
        </article>
      </section>

      <section class="cc-grid" style="margin-bottom: 24px" aria-label="Accesos rápidos">
        <button
            v-for="item in shortcuts"
            :key="item.path"
            type="button"
            class="cc-stat"
            style="text-align: left; cursor: pointer; font-family: inherit"
            @click="router.push(item.path)"
        >
          <div class="cc-stat-top">
            <span>{{ item.label }}</span>
            <span class="cc-stat-icon"><i :class="item.icon"></i></span>
          </div>
          <span class="cc-stat-caption">{{ item.text }}</span>
        </button>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>Últimos tickets</h2>
            <p>Las solicitudes más recientes de tu empresa.</p>
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>Ticket</th>
              <th>Equipo</th>
              <th>Empleado</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="5" class="cc-empty-cell">Cargando información...</td>
            </tr>

            <tr v-else-if="recentTickets.length === 0">
              <td colspan="5" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-inbox"></i>
                  <strong>Aún no hay tickets</strong>
                  <span>Cuando tus empleados reporten una falla, aparecerá aquí.</span>
                </div>
              </td>
            </tr>

            <tr v-else v-for="ticket in recentTickets" :key="ticket.id">
              <td><span class="cc-code">#{{ ticket.id }}</span></td>
              <td>{{ ticket.equipmentName ?? 'Equipo registrado' }}</td>
              <td>{{ ticket.employeeName ?? '—' }}</td>
              <td>{{ formatDate(ticket.createdAt) }}</td>
              <td>
                <span class="cc-badge" :class="statusClass(ticket.status)">{{ ticket.status }}</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>

      <PageFooter />
    </div>
  </main>
</template>
