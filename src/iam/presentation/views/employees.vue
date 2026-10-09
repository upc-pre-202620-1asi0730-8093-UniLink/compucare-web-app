<script setup>
import {onMounted, ref} from "vue";
import useIamStore from "../../application/iam.store.js";
import {useFeedback} from "../../../shared/presentation/use-feedback.js";

const iam = useIamStore();
const {ok, fail} = useFeedback();
const visible = ref(false);
const form = ref({name: '', email: '', position: ''});
const tempPassword = ref(null);

onMounted(() => iam.fetchEmployees().catch(fail));

async function save() {
  try {
    const created = await iam.createEmployee(form.value);
    tempPassword.value = created.tempPassword;   // Simula la invitación por correo
    ok('Empleado registrado e invitado por correo');
    visible.value = false;
    form.value = {name: '', email: '', position: ''};
  } catch (e) {
    fail(e);   // Correo duplicado -> 409
  }
}
</script>

<template>
  <div class="p-4">
    <h1>Empleados</h1>
    <pv-button label="Nuevo empleado" icon="pi pi-plus" class="mb-3" @click="visible = true"/>
    <pv-message v-if="tempPassword" severity="info" class="mb-3">Clave temporal enviada (solo desarrollo): {{ tempPassword }}</pv-message>
    <pv-data-table :value="iam.employees" striped-rows paginator :rows="10">
      <pv-column header="Nombre" field="name" sortable/>
      <pv-column header="Correo" field="email"/>
      <pv-column header="Cargo" field="position"/>
    </pv-data-table>
    <pv-dialog v-model:visible="visible" header="Nuevo empleado" modal class="w-full md:w-25rem">
      <form @submit.prevent="save" class="flex flex-column gap-3">
        <pv-input-text v-model="form.name" placeholder="Nombre" required/>
        <pv-input-text v-model="form.email" type="email" placeholder="Correo" required/>
        <pv-input-text v-model="form.position" placeholder="Cargo"/>
        <pv-button type="submit" label="Guardar"/>
      </form>
    </pv-dialog>
  </div>
</template>
