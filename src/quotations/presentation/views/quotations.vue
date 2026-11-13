<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAutoRefresh } from '../../../shared/application/use-auto-refresh.js'
import { useDomainLabels } from '../../../i18n/domain-labels.js'
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
const { t } = useI18n({ useScope: 'global' })
const { quotationStatusLabel } = useDomainLabels()
const { refresh, refreshing } = useAutoRefresh(() => store.fetchQuotes())

const isAdmin = computed(() => ['admin', 'company_manager'].includes(iam.role))
const isTechnician = computed(() => iam.role === 'technician')

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
const card = ref({ holder: '', last4: '' })

const quotes = computed(() => store.quotes || [])

const filteredQuotes = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return quotes.value

  return quotes.value.filter(q =>
      [q.id, q.ticketId, quotationStatusLabel(q.status), q.total]
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

    ok(t('screens.quotations.created'))
    createVisible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

function approve(quote) {
  confirm.require({
    header: t('screens.quotations.approveTitle'),
    message: t('screens.quotations.approveQuestion', { id: quote.id, amount: formatMoney(quote.total) }),
    icon: 'pi pi-check-circle',
    acceptLabel: t('screens.quotations.confirmApprove'),
    rejectLabel: t('screens.quotations.back'),
    accept: () => changeStatus(quote, 'APPROVED', t('screens.quotations.approved'))
  })
}

function reject(quote) {
  confirm.require({
    header: t('screens.quotations.rejectTitle'),
    message: t('screens.quotations.rejectQuestion', { id: quote.id }),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('screens.quotations.confirmReject'),
    rejectLabel: t('screens.quotations.back'),
    accept: () => changeStatus(quote, 'REJECTED', t('screens.quotations.rejected'))
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
  card.value = { holder: '', last4: '' }
  payVisible.value = true
}

async function pay() {
  if (saving.value) return

  const digits = card.value.last4.trim()
  if (!/^\d{4}$/.test(digits) || !card.value.holder.trim()) {
    fail(new Error(t('common.invalidDemoPayment')))
    return
  }

  saving.value = true

  try {
    // Pago simulado: solo se envía el titular y los últimos 4 dígitos
    await store.pay(selected.value.id, {
      holder: card.value.holder.trim(),
      last4: digits
    })

    ok(t('screens.quotations.paid'))
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
          :eyebrow="t('screens.quotations.s27')"
          :title="t('screens.quotations.s28')"
          :description="isAdmin ? t('screens.quotations.adminDescription') : isTechnician ? t('screens.quotations.technicianDescription') : t('screens.quotations.observerDescription')"
      >
        <button
            v-if="isTechnician"
            class="cc-primary-btn"
            type="button"
            @click="openCreate"
        >
          <i class="pi pi-plus"></i>
          {{ t('screens.quotations.s0') }}
        </button>
      </PageHeader>
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="cc-secondary-btn" type="button" :disabled="refreshing" @click="refresh().catch(fail)">
          <i class="pi pi-refresh" aria-hidden="true"></i>
          {{ refreshing ? t('common.refreshing') : t('common.refresh') }}
        </button>
      </div>

      <section class="cc-stats" :aria-label="t('screens.quotations.s29')">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.quotations.s1') }}</span>
            <span class="cc-stat-icon"><i class="pi pi-file"></i></span>
          </div>
          <strong>{{ quotes.length }}</strong>
          <span class="cc-stat-caption">{{ t('screens.quotations.s2') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.quotations.s3') }}</span>
            <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-clock"></i></span>
          </div>
          <strong>{{ pendingCount }}</strong>
          <span class="cc-stat-caption">{{ t('screens.quotations.s4') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.quotations.s5') }}</span>
            <span class="cc-stat-icon cc-icon-active"><i class="pi pi-wallet"></i></span>
          </div>
          <strong>{{ approvedCount }}</strong>
          <span class="cc-stat-caption">{{ t('screens.quotations.s6') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.quotations.s7') }}</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-check-circle"></i></span>
          </div>
          <strong>{{ paidCount }}</strong>
          <span class="cc-stat-caption">{{ t('screens.quotations.s8') }}</span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>{{ t('screens.quotations.s9') }}</h2>
            <p>{{ t('screens.quotations.s10') }}</p>
          </div>

          <div class="cc-search">
            <i class="pi pi-search"></i>
            <input
                v-model="search"
                type="search"
                :placeholder="t('screens.quotations.s30')"
                :aria-label="t('screens.quotations.s31')"
            />
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>{{ t('screens.quotations.s11') }}</th>
              <th>{{ t('screens.quotations.s12') }}</th>
              <th>{{ t('screens.quotations.s13') }}</th>
              <th>{{ t('screens.quotations.s14') }}</th>
              <th>{{ t('screens.quotations.s15') }}</th>
              <th>{{ t('screens.quotations.s16') }}</th>
              <th class="cc-th-right">{{ t('screens.quotations.s17') }}</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="7" class="cc-empty-cell">{{ t('screens.quotations.s18') }}</td>
            </tr>

            <tr v-else-if="filteredQuotes.length === 0">
              <td colspan="7" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-file"></i>
                  <strong>{{ t('screens.quotations.s19') }}</strong>
                  <span>
                    {{ t(isTechnician ? 'screens.quotations.emptyTech' : 'screens.quotations.emptyOther') }}
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
                  {{ quotationStatusLabel(quote.status) }}
                </span>
              </td>

              <td>
                <div class="cc-actions">
                  <button
                      class="cc-icon-btn"
                      type="button"
                      :title="t('screens.quotations.s32')"
                      :aria-label="t('screens.quotations.viewAria', { id: quote.id })"
                      @click="openDetail(quote)"
                  >
                    <i class="pi pi-eye"></i>
                  </button>

                  <template v-if="isAdmin && quote.status === 'PENDING'">
                    <button
                        class="cc-icon-btn"
                        type="button"
                        :title="t('screens.quotations.s33')"
                        :aria-label="t('screens.quotations.approveAria', { id: quote.id })"
                        @click="approve(quote)"
                    >
                      <i class="pi pi-check"></i>
                    </button>

                    <button
                        class="cc-icon-btn cc-danger"
                        type="button"
                        :title="t('screens.quotations.s34')"
                        :aria-label="t('screens.quotations.rejectAria', { id: quote.id })"
                        @click="reject(quote)"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  </template>

                  <button
                      v-if="isAdmin && quote.status === 'APPROVED'"
                      class="cc-icon-btn"
                      type="button"
                      :title="t('screens.quotations.s35')"
                      :aria-label="t('screens.quotations.payAria', { id: quote.id })"
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
          {{ t('screens.quotations.showing', { shown: filteredQuotes.length, total: quotes.length }) }}
        </div>
      </section>

      <PageFooter />
    </div>

    <!-- Detalle de la cotización -->
    <pv-dialog
        v-model:visible="detailVisible"
        :header="t('screens.quotations.quoteHeader', { id: selected?.id ?? '' })"
        modal
        :style="{ width: 'min(520px, 94vw)' }"
    >
      <div v-if="selected" class="cc-form">
        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>{{ t('screens.quotations.s20') }}</th>
              <th class="cc-th-right">{{ t('screens.quotations.s21') }}</th>
            </tr>
            </thead>

            <tbody>
            <tr v-for="(item, index) in selected.items" :key="index">
              <td>{{ item.description }}</td>
              <td class="cc-th-right">{{ formatMoney(item.cost) }}</td>
            </tr>

            <tr>
              <td><strong>{{ t('screens.quotations.s15') }}</strong></td>
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
          <span>{{ t('screens.quotations.s22') }}</span>
        </div>

        <div class="cc-banner cc-banner-info" v-else>
          <i class="pi pi-info-circle"></i>
          <span>{{ t('screens.quotations.currentStatus', { status: quotationStatusLabel(selected.status) }) }}</span>
        </div>
      </div>
    </pv-dialog>

    <!-- Nueva cotización (técnico) -->
    <pv-dialog
        v-model:visible="createVisible"
        :header="t('screens.quotations.s0')"
        modal
        :style="{ width: 'min(580px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="saveQuote">
        <p class="cc-dialog-desc">
          {{ t('screens.quotations.s23') }}
        </p>

        <div class="cc-field">
          <label for="quote-ticket">{{ t('screens.quotations.s12') }}</label>
          <pv-select
              v-model="form.ticketId"
              input-id="quote-ticket"
              :options="quotableTickets"
              option-label="label"
              option-value="id"
              :placeholder="t('screens.quotations.s36')"
              class="cc-full"
              :empty-message="'No tienes tickets disponibles para cotizar'"
          />
        </div>

        <div class="cc-field">
          <label>{{ t('screens.quotations.s14') }}</label>

          <div
              v-for="(item, index) in form.items"
              :key="index"
              class="cc-form-row"
              style="grid-template-columns: 1fr 130px 34px; align-items: center"
          >
            <input
                v-model="item.description"
                class="cc-input"
                :placeholder="t('screens.quotations.s20')"
                :aria-label="t('screens.quotations.itemDescription', { number: index + 1 })"
            />

            <input
                v-model="item.cost"
                class="cc-input"
                type="number"
                min="0.01"
                step="0.01"
                :placeholder="t('screens.quotations.s37')"
                :aria-label="t('screens.quotations.itemCost', { number: index + 1 })"
            />

            <button
                class="cc-icon-btn cc-danger"
                type="button"
                :title="t('screens.quotations.s38')"
                :disabled="form.items.length === 1"
                @click="removeItem(index)"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>

          <button class="cc-secondary-btn" type="button" style="align-self: flex-start" @click="addItem">
            <i class="pi pi-plus"></i>
            {{ t('screens.quotations.s24') }}
          </button>
        </div>

        <div class="cc-banner cc-banner-info" style="margin-bottom: 0">
          <i class="pi pi-wallet"></i>
          <span>{{ t('screens.quotations.totalQuote') }} <strong>{{ formatMoney(formTotal) }}</strong></span>
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="createVisible = false">
            {{ t('screens.quotations.s25') }}
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving || !canCreate">
            <i class="pi pi-send"></i>
            {{ saving ? t('screens.quotations.sending') : t('screens.quotations.sendQuote') }}
          </button>
        </div>
      </form>
    </pv-dialog>

    <!-- Pago simulado (administrador) -->
    <pv-dialog
        v-model:visible="payVisible"
        :header="t('screens.quotations.payHeader', { id: selected?.id ?? '' })"
        modal
        :style="{ width: 'min(480px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="pay">
        <div class="cc-banner cc-banner-info" style="margin-bottom: 0">
          <i class="pi pi-info-circle"></i>
          <span>{{ t('common.demoPaymentNote') }} <strong>{{ formatMoney(selected?.total) }}</strong>.</span>
        </div>

        <div class="cc-field">
          <label for="pay-holder">{{ t('screens.quotations.s26') }}</label>
          <input id="pay-holder" v-model="card.holder" class="cc-input" :placeholder="t('screens.quotations.s39')" required />
        </div>

        <div class="cc-field">
          <label for="pay-last4">{{ t('common.testCardLast4') }}</label>
          <input
              id="pay-last4"
              v-model="card.last4"
              class="cc-input"
              inputmode="numeric"
              pattern="[0-9]{4}"
              minlength="4"
              maxlength="4"
              placeholder="1234"
              autocomplete="off"
              required
          />
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="payVisible = false">
            {{ t('screens.quotations.s25') }}
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving">
            <i class="pi pi-lock"></i>
            {{ saving ? t('screens.quotations.processing') : t('screens.quotations.payNow') }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
