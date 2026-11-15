<script setup>
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue'
import useEquipmentStore from '../../application/equipment.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const store = useEquipmentStore()
const confirm = useConfirm()
const { ok, fail } = useFeedback()
const { t } = useI18n({ useScope: 'global' })

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const search = ref('')
const form = ref({ name: '', desk: '' })

const locations = computed(() => store.locations || [])
const activeCount = computed(() => locations.value.filter(l => l.active).length)
const inactiveCount = computed(() => locations.value.length - activeCount.value)

const filteredLocations = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return locations.value

  return locations.value.filter(l =>
      [l.name, l.desk].some(value => String(value ?? '').toLowerCase().includes(query))
  )
})

onMounted(async () => {
  loading.value = true

  try {
    await store.fetchLocations()
  } catch (error) {
    fail(error)
  } finally {
    loading.value = false
  }
})

function openCreate() {
  form.value = { name: '', desk: '' }
  visible.value = true
}

async function save() {
  if (saving.value) return

  if (!form.value.name.trim() || !form.value.desk.trim()) return

  saving.value = true

  try {
    await store.createLocation({
      name: form.value.name.trim(),
      desk: form.value.desk.trim()
    })

    ok(t('screens.locations.created'))
    visible.value = false
  } catch (error) {
    fail(error)
  } finally {
    saving.value = false
  }
}

function toggle(location) {
  const activating = !location.active

  confirm.require({
    header: t(activating ? 'screens.locations.activateHeader' : 'screens.locations.deactivateHeader'),
    message: activating
        ? t('screens.locations.activateQuestion', { name: location.name, desk: location.desk })
        : t('screens.locations.deactivateQuestion', { name: location.name, desk: location.desk }),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t(activating ? 'screens.locations.confirmActivate' : 'screens.locations.confirmDeactivate'),
    rejectLabel: t('screens.locations.back'),
    accept: async () => {
      try {
        await store.setLocationActive(location.id, activating)
        ok(t(activating ? 'screens.locations.activated' : 'screens.locations.deactivated'))
      } catch (error) {
        fail(error)
      }
    }
  })
}
</script>

<template>
  <main class="cc-page">
    <div class="cc-container">

      <PageHeader
          :eyebrow="t('screens.locations.s18')"
          :title="t('screens.locations.s2')"
          :description="t('screens.locations.s19')"
      >
        <button class="cc-primary-btn" type="button" @click="openCreate">
          <i class="pi pi-plus"></i>
          {{ t('screens.locations.s0') }}
        </button>
      </PageHeader>

      <section class="cc-stats" :aria-label="t('screens.locations.s20')">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.locations.s1') }}</span>
            <span class="cc-stat-icon"><i class="pi pi-map-marker"></i></span>
          </div>
          <strong>{{ locations.length }}</strong>
          <span class="cc-stat-caption">{{ t('screens.locations.s2') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.locations.s3') }}</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-check-circle"></i></span>
          </div>
          <strong>{{ activeCount }}</strong>
          <span class="cc-stat-caption">{{ t('screens.locations.s4') }}</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>{{ t('screens.locations.s5') }}</span>
            <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-ban"></i></span>
          </div>
          <strong>{{ inactiveCount }}</strong>
          <span class="cc-stat-caption">{{ t('screens.locations.s6') }}</span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>{{ t('screens.locations.s7') }}</h2>
            <p>{{ t('screens.locations.s8') }}</p>
          </div>

          <div class="cc-search">
            <i class="pi pi-search"></i>
            <input
                v-model="search"
                type="search"
                :placeholder="t('screens.locations.s21')"
                :aria-label="t('screens.locations.s22')"
            />
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>{{ t('screens.locations.s9') }}</th>
              <th>{{ t('screens.locations.s10') }}</th>
              <th>{{ t('screens.locations.s11') }}</th>
              <th class="cc-th-right">{{ t('screens.locations.s12') }}</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="4" class="cc-empty-cell">{{ t('screens.locations.s13') }}</td>
            </tr>

            <tr v-else-if="filteredLocations.length === 0">
              <td colspan="4" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-map-marker"></i>
                  <strong>{{ t('screens.locations.s14') }}</strong>
                  <span>{{ t('screens.locations.s15') }}</span>
                </div>
              </td>
            </tr>

            <tr v-else v-for="location in filteredLocations" :key="location.id">
              <td>
                <div class="cc-cell">
                  <span class="cc-cell-icon"><i class="pi pi-building"></i></span>
                  <span>{{ location.name }}</span>
                </div>
              </td>

              <td>{{ location.desk }}</td>

              <td>
                <span
                    class="cc-badge"
                    :class="location.active ? 'cc-badge-done' : 'cc-badge-default'"
                >
                  {{ t(location.active ? 'screens.locations.active' : 'screens.locations.inactive') }}
                </span>
              </td>

              <td>
                <div class="cc-actions">
                  <button
                      class="cc-icon-btn"
                      :class="{ 'cc-danger': location.active }"
                      type="button"
                      :title="t(location.active ? 'screens.locations.deactivate' : 'screens.locations.activate')"
                      :aria-label="t('screens.locations.toggleAria', { action: t(location.active ? 'screens.locations.deactivate' : 'screens.locations.activate'), name: location.name, desk: location.desk })"
                      @click="toggle(location)"
                  >
                    <i :class="location.active ? 'pi pi-ban' : 'pi pi-check-circle'"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="cc-table-footer">
          {{ t('screens.locations.showing', { shown: filteredLocations.length, total: locations.length }) }}
        </div>
      </section>

      <PageFooter />
    </div>

    <pv-dialog
        v-model:visible="visible"
        :header="t('screens.locations.s0')"
        modal
        :style="{ width: 'min(460px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="save">
        <p class="cc-dialog-desc">
          {{ t('screens.locations.s16') }}
        </p>

        <div class="cc-field">
          <label for="loc-name">{{ t('screens.locations.s9') }}</label>
          <input
              id="loc-name"
              v-model="form.name"
              class="cc-input"
              :placeholder="t('screens.locations.s23')"
              required
          />
        </div>

        <div class="cc-field">
          <label for="loc-desk">{{ t('screens.locations.s10') }}</label>
          <input
              id="loc-desk"
              v-model="form.desk"
              class="cc-input"
              :placeholder="t('screens.locations.s24')"
              required
          />
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="visible = false">
            {{ t('screens.locations.s17') }}
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving">
            <i class="pi pi-save"></i>
            {{ saving ? t('screens.locations.saving') : t('screens.locations.saveLocation') }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
