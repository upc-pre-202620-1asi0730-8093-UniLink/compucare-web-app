<script setup>
import {onMounted, ref} from "vue";
import useEquipmentStore from "../../application/equipment.store.js";
import {useFeedback} from "../../../shared/presentation/use-feedback.js";

const store = useEquipmentStore();
const {ok, fail} = useFeedback();
const visible = ref(false);
const form = ref({name: '', desk: ''});

onMounted(() => store.fetchLocations().catch(fail));

async function save() {
  try {
    await store.createLocation(form.value);
    ok('Ubicación creada');
    visible.value = false;
    form.value = {name: '', desk: ''};
  } catch (e) {
    fail(e);
  }
}

async function toggle(loc) {
  try {
    await store.setLocationActive(loc.id, !loc.active);   // Una sede inactiva no admite nuevos equipos
  } catch (e) {
    fail(e);
  }
}
</script>

<template>
  <div class="p-4">
    <h1>Sedes y escritorios</h1>
    <pv-button label="Nueva ubicación" icon="pi pi-plus" class="mb-3" @click="visible = true"/>
    <pv-data-table :value="store.locations" striped-rows paginator :rows="10">
      <pv-column header="Sede" field="name" sortable/>
      <pv-column header="Escritorio" field="desk"/>
      <pv-column header="Estado">
        <template #body="{data}"><pv-tag :value="data.active ? 'Activa' : 'Inactiva'" :severity="data.active ? 'success' : 'secondary'"/></template>
      </pv-column>
      <pv-column header="Acciones">
        <template #body="{data}">
          <pv-button :label="data.active ? 'Desactivar' : 'Activar'" text @click="toggle(data)"/>
        </template>
      </pv-column>
    </pv-data-table>
    <pv-dialog v-model:visible="visible" header="Nueva ubicación" modal class="w-full md:w-25rem">
      <form @submit.prevent="save" class="flex flex-column gap-3">
        <pv-input-text v-model="form.name" placeholder="Nombre de la sede" required/>
        <pv-input-text v-model="form.desk" placeholder="Escritorio / puesto" required/>
        <pv-button type="submit" label="Guardar"/>
      </form>
    </pv-dialog>
  </div>
</template>
