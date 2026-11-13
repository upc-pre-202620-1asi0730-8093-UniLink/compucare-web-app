<script setup>
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import useIamStore from '../../application/iam.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const iam = useIamStore()
const { ok, fail } = useFeedback()
const { t } = useI18n({ useScope: 'global' })

const visible = ref(false)
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const form = ref({ name: '', email: '', position: '' })
const tempPassword = ref(null)

const employees = computed(() => iam.employees || [])

const filteredEmployees = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return employees.value

  return employees.value.filter(employee =>
      [employee.name, employee.email, employee.position]
          .some(value => String(value ?? '').toLowerCase().includes(query))
  )
})

onMounted(async () => {
  loading.value = true

  try {
    await iam.fetchEmployees()
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function openCreate() {
  form.value = { name: '', email: '', position: '' }
  visible.value = true
}

async function save() {
  if (saving.value) return

  saving.value = true

  try {
    const created = await iam.createEmployee({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      position: form.value.position.trim()
    })

    tempPassword.value = created.tempPassword   // Simula la invitación por correo
    ok('Empleado registrado e invitado por correo')
    visible.value = false
  } catch (error) {
    fail(error)   // Correo duplicado -> 409
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="cc-page">
    <div class="cc-container">

      <PageHeader
          :eyebrow="t('screens.employees.s12')"
          :title="t('screens.employees.s13')"
          :description="t('screens.employees.s14')"
      >
        <button class="cc-primary-btn" type="button" @click="openCreate">
          <i class="pi pi-plus"></i>
          {{ t('screens.employees.s0') }}
        </button>
      </PageHeader>

      <div v-if="tempPassword" class="cc-banner cc-banner-info" role="status">
        <i class="pi pi-info-circle"></i>
        <span>
          Clave temporal enviada (solo desarrollo): <strong>{{ tempPassword }}</strong>
        </span>
      </div>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>{{ t('screens.employees.s1') }}</h2>
            <p>{{ employees.length }} empleado(s) en tu empresa.</p>
          </div>

          <div class="cc-search">
            <i class="pi pi-search"></i>
            <input
                v-model="search"
                type="search"
                :placeholder="t('screens.employees.s15')"
                :aria-label="t('screens.employees.s16')"
            />
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>{{ t('screens.employees.s2') }}</th>
              <th>{{ t('screens.employees.s3') }}</th>
              <th>{{ t('screens.employees.s4') }}</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="3" class="cc-empty-cell">{{ t('screens.employees.s5') }}</td>
            </tr>

            <tr v-else-if="filteredEmployees.length === 0">
              <td colspan="3" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-users"></i>
                  <strong>{{ t('screens.employees.s6') }}</strong>
                  <span>{{ t('screens.employees.s7') }}</span>
                </div>
              </td>
            </tr>

            <tr v-else v-for="employee in filteredEmployees" :key="employee.id">
              <td>
                <div class="cc-cell">
                  <span class="cc-cell-avatar">{{ employee.name.charAt(0).toUpperCase() }}</span>
                  <span>{{ employee.name }}</span>
                </div>
              </td>

              <td>{{ employee.email }}</td>

              <td>
                <span v-if="employee.position">{{ employee.position }}</span>
                <span v-else class="cc-muted">{{ t('screens.employees.s8') }}</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="cc-table-footer">
          Mostrando {{ filteredEmployees.length }} de {{ employees.length }} empleados
        </div>
      </section>

      <PageFooter />
    </div>

    <pv-dialog
        v-model:visible="visible"
        :header="t('screens.employees.s0')"
        modal
        :style="{ width: 'min(460px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="save">
        <p class="cc-dialog-desc">
          Se enviará una invitación al correo del empleado con una clave temporal.
        </p>

        <div class="cc-field">
          <label for="emp-name">{{ t('screens.employees.s9') }}</label>
          <input id="emp-name" v-model="form.name" class="cc-input" required />
        </div>

        <div class="cc-field">
          <label for="emp-email">{{ t('screens.employees.s3') }}</label>
          <input id="emp-email" v-model="form.email" class="cc-input" type="email" required />
        </div>

        <div class="cc-field">
          <label for="emp-position">{{ t('screens.employees.s10') }}</label>
          <input id="emp-position" v-model="form.position" class="cc-input" />
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="visible = false">
            {{ t('screens.employees.s11') }}
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving">
            <i class="pi pi-send"></i>
            {{ saving ? 'Guardando...' : 'Registrar e invitar' }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
