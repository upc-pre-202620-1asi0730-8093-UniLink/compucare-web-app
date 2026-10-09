<script setup>
import {ref} from "vue";
import useIamStore from "../../application/iam.store.js";
import {useFeedback} from "../../../shared/presentation/use-feedback.js";

const iam = useIamStore();
const {ok, fail} = useFeedback();
const form = ref({name: iam.user.name, phone: iam.user.phone ?? ''});
const pass = ref({current: '', next: ''});

async function saveProfile() {
  try {
    await iam.updateProfile(form.value);
    ok('Perfil actualizado');
  } catch (e) {
    fail(e);
  }
}

async function savePassword() {
  try {
    await iam.changePassword(pass.value.current, pass.value.next);
    ok('Contraseña actualizada');
    pass.value = {current: '', next: ''};
  } catch (e) {
    fail(e);   // "La clave actual no coincide"
  }
}
</script>

<template>
  <div class="p-4 grid">
    <div class="col-12 md:col-6">
      <h2>Mi perfil</h2>
      <p class="text-color-secondary">{{ iam.user.email }}</p>
      <form @submit.prevent="saveProfile" class="flex flex-column gap-3">
        <pv-input-text v-model="form.name" placeholder="Nombre" required/>
        <pv-input-text v-model="form.phone" placeholder="Teléfono"/>
        <pv-button type="submit" label="Guardar Cambios" icon="pi pi-save"/>
      </form>
    </div>
    <div class="col-12 md:col-6">
      <h2>Cambiar contraseña</h2>
      <form @submit.prevent="savePassword" class="flex flex-column gap-3">
        <pv-input-text v-model="pass.current" type="password" placeholder="Contraseña actual" required/>
        <pv-input-text v-model="pass.next" type="password" placeholder="Nueva contraseña" minlength="6" required/>
        <pv-button type="submit" label="Actualizar clave" severity="secondary"/>
      </form>
    </div>
  </div>
</template>
