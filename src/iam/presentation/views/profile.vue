<script setup>
import { computed, ref } from 'vue'
import useIamStore from '../../application/iam.store.js'
import { useFeedback } from '../../../shared/presentation/use-feedback.js'
import { roleLabels } from '../../../shared/presentation/format.js'
import PageHeader from '../../../shared/presentation/page-header.vue'
import PageFooter from '../../../shared/presentation/page-footer.vue'

const iam = useIamStore()
const { ok, fail } = useFeedback()

const form = ref({ name: iam.user?.name ?? '', phone: iam.user?.phone ?? '' })
const pass = ref({ current: '', next: '' })
const savingProfile = ref(false)
const savingPassword = ref(false)

const initial = computed(() => (iam.user?.name ?? 'U').charAt(0).toUpperCase())
const roleLabel = computed(() => roleLabels[iam.role] ?? 'Usuario')

async function saveProfile() {
  if (savingProfile.value) return

  savingProfile.value = true

  try {
    await iam.updateProfile({
      name: form.value.name.trim(),
      phone: form.value.phone.trim()
    })

    ok('Perfil actualizado')
  } catch (error) {
    fail(error)
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  if (savingPassword.value) return

  savingPassword.value = true

  try {
    await iam.changePassword(pass.value.current, pass.value.next)

    ok('Contraseña actualizada')
    pass.value = { current: '', next: '' }
  } catch (error) {
    fail(error)   // "La clave actual no coincide"
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <main class="cc-page">
    <div class="cc-container">

      <PageHeader
          eyebrow="MI CUENTA"
          title="Mi perfil"
          description="Actualiza tus datos de contacto y mantén segura tu contraseña."
      />

      <section class="cc-grid-2">

        <article class="cc-card">
          <div class="cc-card-head">
            <div style="display: flex; align-items: center; gap: 16px">
              <span
                  class="cc-cell-avatar"
                  style="width: 56px; height: 56px; border-radius: 14px; font-size: 22px"
              >
                {{ initial }}
              </span>

              <div>
                <h2>{{ iam.user?.name }}</h2>
                <p>{{ iam.user?.email }}</p>
              </div>
            </div>

            <span class="cc-badge cc-badge-done">{{ roleLabel }}</span>
          </div>

          <div class="cc-card-body">
            <form class="cc-form" @submit.prevent="saveProfile">
              <div class="cc-field">
                <label for="profile-email">Correo electrónico</label>
                <input id="profile-email" class="cc-input" :value="iam.user?.email" readonly />
                <small>El correo no se puede modificar.</small>
              </div>

              <div class="cc-field">
                <label for="profile-position">Cargo</label>
                <input id="profile-position" class="cc-input" :value="iam.user?.position || '—'" readonly />
              </div>

              <div class="cc-field">
                <label for="profile-name">Nombre completo</label>
                <input
                    id="profile-name"
                    v-model="form.name"
                    class="cc-input"
                    autocomplete="name"
                    :disabled="savingProfile"
                    required
                />
              </div>

              <div class="cc-field">
                <label for="profile-phone">Teléfono</label>
                <input
                    id="profile-phone"
                    v-model="form.phone"
                    class="cc-input"
                    type="tel"
                    autocomplete="tel"
                    placeholder="999 999 999"
                    :disabled="savingProfile"
                />
              </div>

              <div class="cc-dialog-actions">
                <button class="cc-primary-btn" type="submit" :disabled="savingProfile">
                  <i class="pi pi-save"></i>
                  {{ savingProfile ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </form>
          </div>
        </article>

        <article class="cc-card">
          <div class="cc-card-head">
            <div>
              <h2>Cambiar contraseña</h2>
              <p>Usa una contraseña de al menos 6 caracteres.</p>
            </div>

            <span class="cc-stat-icon"><i class="pi pi-lock"></i></span>
          </div>

          <div class="cc-card-body">
            <form class="cc-form" @submit.prevent="savePassword">
              <div class="cc-field">
                <label for="current-password">Contraseña actual</label>
                <input
                    id="current-password"
                    v-model="pass.current"
                    class="cc-input"
                    type="password"
                    autocomplete="current-password"
                    :disabled="savingPassword"
                    required
                />
              </div>

              <div class="cc-field">
                <label for="new-password">Nueva contraseña</label>
                <input
                    id="new-password"
                    v-model="pass.next"
                    class="cc-input"
                    type="password"
                    minlength="6"
                    autocomplete="new-password"
                    :disabled="savingPassword"
                    required
                />
              </div>

              <div class="cc-dialog-actions">
                <button class="cc-primary-btn" type="submit" :disabled="savingPassword">
                  <i class="pi pi-key"></i>
                  {{ savingPassword ? 'Actualizando...' : 'Actualizar contraseña' }}
                </button>
              </div>
            </form>
          </div>
        </article>

      </section>

      <PageFooter />
    </div>
  </main>
</template>
