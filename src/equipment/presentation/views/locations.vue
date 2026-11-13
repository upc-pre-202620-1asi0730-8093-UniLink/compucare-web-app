<script setup>
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from 'primevue'
import useEquipmentStore from '../../application/equipment.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const store = useEquipmentStore()
const confirm = useConfirm()
const { ok, fail } = useFeedback()

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

    ok('Ubicación registrada correctamente')
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
    header: activating ? 'Activar ubicación' : 'Desactivar ubicación',
    message: activating
        ? `¿Deseas activar ${location.name} · ${location.desk}?`
        : `¿Deseas desactivar ${location.name} · ${location.desk}? No podrá usarse para nuevos equipos.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: activating ? 'Sí, activar' : 'Sí, desactivar',
    rejectLabel: 'Volver',
    accept: async () => {
      try {
        await store.setLocationActive(location.id, activating)
        ok(activating ? 'Ubicación activada' : 'Ubicación desactivada')
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
          eyebrow="INVENTARIO"
          title="Sedes y escritorios"
          description="Define dónde se encuentra cada equipo para que el soporte técnico llegue al lugar correcto."
      >
        <button class="cc-primary-btn" type="button" @click="openCreate">
          <i class="pi pi-plus"></i>
          Nueva ubicación
        </button>
      </PageHeader>

      <section class="cc-stats" aria-label="Resumen de ubicaciones">
        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Total de ubicaciones</span>
            <span class="cc-stat-icon"><i class="pi pi-map-marker"></i></span>
          </div>
          <strong>{{ locations.length }}</strong>
          <span class="cc-stat-caption">Sedes y escritorios</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Activas</span>
            <span class="cc-stat-icon cc-icon-done"><i class="pi pi-check-circle"></i></span>
          </div>
          <strong>{{ activeCount }}</strong>
          <span class="cc-stat-caption">Disponibles para equipos</span>
        </article>

        <article class="cc-stat">
          <div class="cc-stat-top">
            <span>Inactivas</span>
            <span class="cc-stat-icon cc-icon-pending"><i class="pi pi-ban"></i></span>
          </div>
          <strong>{{ inactiveCount }}</strong>
          <span class="cc-stat-caption">Fuera de uso</span>
        </article>
      </section>

      <section class="cc-card">
        <div class="cc-card-head">
          <div>
            <h2>Ubicaciones registradas</h2>
            <p>Activa o desactiva las ubicaciones según las necesidades de tu empresa.</p>
          </div>

          <div class="cc-search">
            <i class="pi pi-search"></i>
            <input
                v-model="search"
                type="search"
                placeholder="Buscar ubicación..."
                aria-label="Buscar ubicaciones"
            />
          </div>
        </div>

        <div class="cc-table-wrap">
          <table class="cc-table">
            <thead>
            <tr>
              <th>Sede</th>
              <th>Escritorio</th>
              <th>Estado</th>
              <th class="cc-th-right">Acciones</th>
            </tr>
            </thead>

            <tbody>
            <tr v-if="loading">
              <td colspan="4" class="cc-empty-cell">Cargando ubicaciones...</td>
            </tr>

            <tr v-else-if="filteredLocations.length === 0">
              <td colspan="4" class="cc-empty-cell">
                <div class="cc-empty">
                  <i class="pi pi-map-marker"></i>
                  <strong>No hay ubicaciones para mostrar</strong>
                  <span>Registra la primera sede de tu empresa.</span>
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
                  {{ location.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>

              <td>
                <div class="cc-actions">
                  <button
                      class="cc-icon-btn"
                      :class="{ 'cc-danger': location.active }"
                      type="button"
                      :title="location.active ? 'Desactivar' : 'Activar'"
                      :aria-label="`${location.active ? 'Desactivar' : 'Activar'} ${location.name} ${location.desk}`"
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
          Mostrando {{ filteredLocations.length }} de {{ locations.length }} ubicaciones
        </div>
      </section>

      <PageFooter />
    </div>

    <pv-dialog
        v-model:visible="visible"
        header="Nueva ubicación"
        modal
        :style="{ width: 'min(460px, 94vw)' }"
    >
      <form class="cc-form" @submit.prevent="save">
        <p class="cc-dialog-desc">
          Indica la sede y el escritorio donde se ubicará el equipo.
        </p>

        <div class="cc-field">
          <label for="loc-name">Sede</label>
          <input
              id="loc-name"
              v-model="form.name"
              class="cc-input"
              placeholder="Ej. Sede Central - Lima"
              required
          />
        </div>

        <div class="cc-field">
          <label for="loc-desk">Escritorio</label>
          <input
              id="loc-desk"
              v-model="form.desk"
              class="cc-input"
              placeholder="Ej. Escritorio 3"
              required
          />
        </div>

        <div class="cc-dialog-actions">
          <button class="cc-secondary-btn" type="button" :disabled="saving" @click="visible = false">
            Cancelar
          </button>

          <button class="cc-primary-btn" type="submit" :disabled="saving">
            <i class="pi pi-save"></i>
            {{ saving ? 'Guardando...' : 'Guardar ubicación' }}
          </button>
        </div>
      </form>
    </pv-dialog>
  </main>
</template>
