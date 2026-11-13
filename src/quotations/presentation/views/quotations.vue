<script setup>
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue'
import useQuotationStore from '../../application/quotation.store.js'
import useTicketStore from '../../../service-requests/application/ticket.store.js'
import useIamStore from '../../../iam/application/iam.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import { formatDate, formatMoney } from '../../../shared/presentation/format.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const store = useQuotationStore()
const tickets = useTicketStore()
const iam = useIamStore()
const confirm = useConfirm()
const { ok, fail } = useFeedback()

const isAdmin = computed(() => ['admin', 'company_manager'].includes(iam.role))
const isTechnician = computed(() => iam.role === 'technician')

const statusLabels = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  PAID: 'Pagada'
}

const statusClasses = {
  PENDING: 'cc-badge-pending',
  APPROVED: 'cc-badge-assigned',
  REJECTED: 'cc-badge-cancel',
  PAID: 'cc-badge-done'
}

const loading = ref(false)
const saving = ref(false)
const search = ref('')

const detailVisible = ref(false)
const createVisible = ref(false)
const payVisible = ref(false)
const selected = ref(null)

const form = ref({ ticketId: null, items: [{ description: '', cost: null }] })
const card = ref({ holder: '', number: '', expiry: '', cvv: '' })

const quotes = computed(() => store.quotes || [])

const filteredQuotes = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return quotes.value

  return quotes.value.filter(q =>
      [q.id, q.ticketId, statusLabels[q.status], q.total]
          .some(value => String(value ?? '').toLowerCase().includes(query))
  )
})

const pendingCount = computed(() => quotes.value.filter(q => q.status === 'PENDING').length)
const approvedCount = computed(() => quotes.value.filter(q => q.status === 'APPROVED').length)
const paidCount = computed(() => quotes.value.filter(q => q.status === 'PAID').length)

const quotableTickets = computed(() =>
    (tickets.tickets || [])
        .filter(t => ['Asignado', 'En Diagnóstico'].includes(t.status))
        .map(t => ({ id: t.id, label: `#${t.id} · ${t.equipmentName ?? 'Equipo'} · ${t.category}` }))
)

const formTotal = computed(() =>
    form.value.items.reduce((sum, item) => sum + (Number(item.cost) > 0 ? Number(item.cost) : 0), 0)
)

const canCreate = computed(() =>
    !!form.value.ticketId &&
    form.value.items.length > 0 &&
    form.value.items.every(item => item.description.trim() && Number(item.cost) > 0)
)

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      store.fetchQuotes(),
      isTechnician.value ? tickets.fetchTickets() : Promise.resolve()
    ])
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function openDetail(quote) {
  selected.value = quote
  detailVisible.value = true
}

function openCreate() {
  form.value = { ticketId: null, items: [{ description: '', cost: null }] }
  createVisible.value = true
}

function addItem() {
  form.value.items.push({ description: '', cost: null })
}

function removeItem(index) {
  if (form.value.items.length > 1) form.value.items.splice(index, 1)
}

async function saveQuote() {
  if (saving.value || !canCreate.value) return

  saving.value = true

  try {
    await store.createQuote({
      ticketId: form.value.ticketId,
      items: form.value.items.map(item => ({
        description: item.description.trim(),
        cost: Number(item.cost)
      }))
    })

    ok('Cotización enviada al cliente')
    createVisible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

function approve(quote) {
  confirm.require({
    header: 'Aprobar cotización',
    message: `¿Apruebas la cotización #${quote.id} por ${formatMoney(quote.total)}?`,
    icon: 'pi pi-check-circle',
    acceptLabel: 'Sí, aprobar',
    rejectLabel: 'Volver',
    accept: () => changeStatus(quote, 'APPROVED', 'Cotización aprobada')
  })
}

function reject(quote) {
  confirm.require({
    header: 'Rechazar cotización',
    message: `¿Deseas rechazar la cotización #${quote.id}? La orden de servicio quedará pausada.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, rechazar',
    rejectLabel: 'Volver',
    accept: () => changeStatus(quote, 'REJECTED', 'Cotización rechazada')
  })
}

async function changeStatus(quote, status, message) {
  try {
    await store.setStatus(quote.id, status)
    ok(message)
  } catch (error) {
    fail(error)
  }
}

function openPay(quote) {
  selected.value = quote
  card.value = { holder: '', number: '', expiry: '', cvv: '' }
  payVisible.value = true
}

async function pay() {
  if (saving.value) return

  const digits = card.value.number.replace(/\D/g, '')

  if (digits.length < 4) {
    fail(new Error('Ingresa un número de tarjeta de prueba válido'))
    return
  }

  saving.value = true

  try {
    // Pago simulado: solo se envía el titular y los últimos 4 dígitos
    await store.pay(selected.value.id, {
      holder: card.value.holder.trim(),
      last4: digits.slice(-4)
    })

    ok('Pago registrado correctamente')
    payVisible.value = false
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
          eyebrow="COTIZACIONES Y PAGOS"
          title="Cotizaciones"
          :description="isAdmin
            ? 'Revisa las cotizaciones del soporte técnico, apruébalas y realiza el pago desde un solo lugar.'
            : isTechnician
              ? 'Cotiza repuestos y servicios adicionales para los tickets que tienes asignados.'
              : 'Consulta todas las cotizaciones emitidas por el equipo técnico.'"
      >
        <button
            v-if="isTechnician"
            class="cc-primary-btn"
            type="button"
            @click="openCreate"
        >
          <i class="pi pi-plus"></i>
          Nueva cotización
        </button>
      </PageHeader>

      <section class="cc-stats" aria-label="Resumen de cotizaciones">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Total de cotizaciones</span>
            <span class="cc-stat-icon"><i class="pi pi-file"></i></span>
          </div>
          <strong>{{ quotes.length }}</strong>
          <span class="cc-stat-caption">Cotizaciones registradas</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Pendientes</span>
            <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-clock"></i></span>
          </div>
          <strong>{{ pendingCount }}</strong>
          <span class="cc-stat-caption">Esperando aprobación</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Por pagar</span>
            <span class="cc-stat-icon cc-icon-active"><i class="pi pi-wallet"></i></span>
          </div>
          <strong>{{ approvedCount }}</strong>
          <span class="cc-stat-caption">Aprobadas sin pago</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Pagadas</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-check-circle"></i></span>
          </div>
          <strong>{{ paidCount }}</strong>
          <span class="cc-stat-caption">Con recibo emitido</span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>Historial de cotizaciones</h2>
            <p>Consulta el detalle, el estado y el recibo de cada cotización.</p>
          </div>

          <div class="cc-search">
            <i class="pi pi-search"></i>
            <input
                v-model="search"
                type="search"
                placeholder="Buscar cotización..."
                aria-label="Buscar cotizaciones"
            />
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>Cotización</th>
              <th>Ticket</th>
              <th>Fecha</th>
              <th>Ítems</th>
              <th>Total</th>
              <th>Estado</th>
              <th class="cc-th-right">Acciones</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="7" class="cc-empty-cell">Cargando cotizaciones...</td>
            </tr>

            <tr v-else-if="filteredQuotes.length === 0">
              <td colspan="7" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-file"></i>
                  <strong>No hay cotizaciones para mostrar</strong>
                  <span>
                    {{ isTechnician
                      ? 'Crea una cotización desde uno de tus tickets asignados.'
                      : 'Cuando el técnico emita una cotización, aparecerá aquí.' }}
                  </span>
                </div>
              </td>
            </tr>

            <tr v-else v-for="quote in filteredQuotes" :key="quote.id">
              <td><span class="cc-code">#{{ quote.id }}</span></td>
              <td>#{{ quote.ticketId }}</td>
              <td>{{ formatDate(quote.createdAt) }}</td>
              <td>{{ quote.items.length }}</td>
              <td><strong>{{ formatMoney(quote.total) }}</strong></td>

              <td>
                <span class="cc-badge" :class="statusClasses[quote.status] ?? 'cc-badge-default'">
                  {{ statusLabels[quote.status] ?? quote.status }}
                </span>
              </td>

              <td>
                <div class="cc-actions">
                  <button
                      class="cc-icon-btn"
                      type="button"
                      title="Ver detalle"
                      :aria-label="`Ver detalle de la cotización ${quote.id}`"
                      @click="openDetail(quote)"
                  >
                    <i class="pi pi-eye"></i>
                  </button>

                  <template v-if="isAdmin && quote.status === 'PENDING'">
                    <button
                        class="cc-icon-btn"
                        type="button"
                        title="Aprobar"
                        :aria-label="`Aprobar cotización ${quote.id}`"
                        @click="approve(quote)"
                    >
                      <i class="pi pi-check"></i>
                    </button>

                    <button
                        class="cc-icon-btn cc-danger"
                        type="button"
                        title="Rechazar"
                        :aria-label="`Rechazar cotización ${quote.id}`"
                        @click="reject(quote)"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  </template>

                  <button
                      v-if="isAdmin && quote.status === 'APPROVED'"
                      class="cc-icon-btn"
                      type="button"
                      title="Pagar"
                      :aria-label="`Pagar cotización ${quote.id}`"
                      @click="openPay(quote)"
                  >
                    <i class="pi pi-credit-card"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="cc-table-footer">
          Mostrando {{ filteredQuotes.length }} de {{ quotes.length }} cotizaciones
        </div>
      </section>

      <PageFooter />
    </div>

    <!-- Detalle de la cotización -->
    <pv-dialog
        v-model:visible="detailVisible"
        :header="`Cotización #${selected?.id ?? ''}`"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <div v-if="selected" class="cc-form">
        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>Descripción</th>
              <th class="cc-th-right">Costo</th>
            </tr>
            </thead>

            <tbody>
            <tr v-for="(item, index) in selected.items" :key="index">
              <td>{{ item.description }}</td>
              <td class="cc-th-right">{{ formatMoney(item.cost) }}</td>
            </tr>

            <tr>
              <td><strong>Total</strong></td>
              <td class="cc-th-right"><strong>{{ formatMoney(selected.total) }}</strong></td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="cc-banner cc-banner-ok" v-if="selected.status === 'PAID'">
          <i class="pi pi-check-circle"></i>
          <span>
            Pagada el {{ formatDate(selected.paidAt) }}.
            Recibo <strong>{{ selected.receipt }}</strong>.
          </span>
        </div>

        <div class="cc-banner cc-banner-warn" v-else-if="selected.status === 'REJECTED'">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Cotización rechazada. La orden de servicio permanece pausada.</span>
        </div>

        <div class="cc-banner cc-banner-info" v-else>
          <i class="pi pi-info-circle"></i>
          <span>Estado actual: {{ statusLabels[selected.status] ?? selected.status }}.</span>
        </div>
      </div>
    </pv-dialog>

    <!-- Nueva cotización (técnico) -->
    <pv-dialog
        v-model:visible="createVisible"
        header="Nueva cotización"
        modal
        :style="{ width: 'min(580px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="saveQuote">
        <p class="cc-dialog-desc">
          Selecciona el ticket y detalla los repuestos o servicios adicionales.
        </p>

        <div class="cc-field">
          <label for="quote-ticket">Ticket</label>
          <pv-select
              v-model="form.ticketId"
              input-id="quote-ticket"
              :options="quotableTickets"
              option-label="label"
              option-value="id"
              placeholder="Selecciona un ticket asignado"
              class="cc-full"
              :empty-message="'No tienes tickets disponibles para cotizar'"
          />
        </div>

        <div class="cc-field">
          <label>Ítems</label>

          <div
              v-for="(item, index) in form.items"
              :key="index"
              class="cc-form-row"
              style="grid-template-columns: 1fr 130px 34px; align-items: center"
          >
            <input
                v-model="item.description"
                class="cc-input"
                placeholder="Descripción"
                :aria-label="`Descripción del ítem ${index + 1}`"
            />

            <input
                v-model="item.cost"
                class="cc-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Costo (S/)"
                :aria-label="`Costo del ítem ${index + 1}`"
            />

            <button
                class="cc-icon-btn cc-danger"
                type="button"
                title="Quitar ítem"
                :disabled="form.items.length === 1"
                @click="removeItem(index)"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>

          <button class="cc-secondary-btn" type="button" style="align-self: flex-start" @click="addItem">
            <i class="pi pi-plus"></i>
            Agregar ítem
          </button>
        </div>

        <div class="cc-banner cc-banner-info" style="margin-bottom: 0">
          <i class="pi pi-wallet"></i>
          <span>Total de la cotización: <strong>{{ formatMoney(formTotal) }}</strong></span>
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="createVisible = false">
            Cancelar
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving || !canCreate">
            <i class="pi pi-send"></i>
            {{ saving ? 'Enviando...' : 'Enviar cotización' }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <!-- Pago simulado (administrador) -->
    <pv-dialog
        v-model:visible="payVisible"
        :header="`Pagar cotización #${selected?.id ?? ''}`"
        modal
        :style="{ width: 'min(480px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="pay">
        <div class="cc-banner cc-banner-info" style="margin-bottom: 0">
          <i class="pi pi-info-circle"></i>
          <span>
            Pago simulado de <strong>{{ formatMoney(selected?.total) }}</strong>.
            Usa una tarjeta de prueba: solo se guardan el titular y los últimos 4 dígitos.
          </span>
        </div>

        <div class="cc-field">
          <label for="pay-holder">Titular de la tarjeta</label>
          <input id="pay-holder" v-model="card.holder" class="cc-input" placeholder="Nombre del titular" required />
        </div>

        <div class="cc-field">
          <label for="pay-number">Número de tarjeta de prueba</label>
          <input
              id="pay-number"
              v-model="card.number"
              class="cc-input"
              inputmode="numeric"
              maxlength="16"
              placeholder="4111111111111111"
              required
          />
        </div>

        <div class="cc-form-row">
          <div class="cc-field">
            <label for="pay-expiry">Vencimiento</label>
            <input id="pay-expiry" v-model="card.expiry" class="cc-input" placeholder="MM/AA" required />
          </div>

          <div class="cc-field">
            <label for="pay-cvv">CVV</label>
            <input
                id="pay-cvv"
                v-model="card.cvv"
                class="cc-input"
                inputmode="numeric"
                maxlength="4"
                placeholder="123"
                required
            />
          </div>
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="payVisible = false">
            Cancelar
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving">
            <i class="pi pi-lock"></i>
            {{ saving ? 'Procesando...' : 'Pagar ahora' }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
