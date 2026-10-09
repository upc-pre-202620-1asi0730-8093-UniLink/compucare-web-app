<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import useEquipmentStore from "../../application/equipment.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {useFeedback} from "../../../shared/presentation/use-feedback.js";

const router = useRouter();
const store = useEquipmentStore();
const iam = useIamStore();
const {ok, fail} = useFeedback();

const types = ['Laptop', 'Desktop', 'Impresora', 'Red', 'Otro'];
const statuses = ['Operativo', 'En Reparación'];
const filters = ref({q: '', status: null, type: null, locationId: null});   // US-11
const activeLocations = computed(() => store.locations.filter(l => l.active));
const locationLabel = (l) => `${l.name} · ${l.desk}`;
const locationName = (id) => { const l = store.locations.find(x => x.id === id); return l ? locationLabel(l) : '-'; };
const employeeName = (id) => iam.employees.find(e => e.id === id)?.name ?? 'Sin asignar';

onMounted(() => {
  store.fetchLocations().catch(fail);
  iam.fetchEmployees().catch(fail);
  load();
});
watch(() => [filters.value.status, filters.value.type, filters.value.locationId], () => load());

const load = () => store.fetchEquipments(filters.value).catch(fail);

// Alta de equipo (US-07)
const newVisible = ref(false);
const form = ref({name: '', serialNumber: '', type: null, locationId: null});
async function save() {
  try {
    await store.createEquipment(form.value);
    ok('Equipo registrado');
    newVisible.value = false;
    form.value = {name: '', serialNumber: '', type: null, locationId: null};
  } catch (e) {
    fail(e);
  }
}

// Asignación (US-08)
const assignVisible = ref(false);
const assignTarget = ref(null);
const assignEmployee = ref(null);
const openAssign = (e) => { assignTarget.value = e; assignEmployee.value = e.assignedTo; assignVisible.value = true; };
async function assign() {
  try {
    await store.assignEquipment(assignTarget.value.id, assignEmployee.value);
    ok('Equipo asignado');
    assignVisible.value = false;
  } catch (e) {
    fail(e);
  }
}
</script>

<template>
  <div class="p-4">
    <h1>Inventario de equipos</h1>
    <div class="flex flex-wrap gap-2 mb-3">
      <pv-input-text v-model="filters.q" placeholder="Buscar por serie o nombre" @keyup.enter="load"/>
      <pv-select v-model="filters.status" :options="statuses" placeholder="Estado" show-clear/>
      <pv-select v-model="filters.type" :options="types" placeholder="Tipo" show-clear/>
      <pv-select v-model="filters.locationId" :options="store.locations" :option-label="locationLabel" option-value="id" placeholder="Sede" show-clear/>
      <pv-button icon="pi pi-search" label="Buscar" @click="load"/>
      <pv-button icon="pi pi-plus" label="Nuevo equipo" severity="success" @click="newVisible = true"/>
    </div>
    <pv-data-table :value="store.equipments" striped-rows paginator :rows="10">
      <pv-column header="Código" field="code" sortable/>
      <pv-column header="Nombre" field="name" sortable/>
      <pv-column header="Serie" field="serialNumber"/>
      <pv-column header="Tipo" field="type"/>
      <pv-column header="Ubicación"><template #body="{data}">{{ locationName(data.locationId) }}</template></pv-column>
      <pv-column header="Asignado a"><template #body="{data}">{{ employeeName(data.assignedTo) }}</template></pv-column>
      <pv-column header="Estado">
        <template #body="{data}"><pv-tag :value="data.status" :severity="data.status === 'Operativo' ? 'success' : 'warn'"/></template>
      </pv-column>
      <pv-column header="Acciones">
        <template #body="{data}">
          <pv-button icon="pi pi-user" rounded text @click="openAssign(data)"/>
          <pv-button icon="pi pi-history" rounded text @click="router.push({name: 'equipment-history', params: {id: data.id}})"/>
        </template>
      </pv-column>
    </pv-data-table>

    <pv-dialog v-model:visible="newVisible" header="Nuevo equipo" modal class="w-full md:w-25rem">
      <form @submit.prevent="save" class="flex flex-column gap-3">
        <pv-input-text v-model="form.name" placeholder="Nombre" required/>
        <pv-input-text v-model="form.serialNumber" placeholder="Número de serie"/>
        <pv-select v-model="form.type" :options="types" placeholder="Tipo"/>
        <pv-select v-model="form.locationId" :options="activeLocations" :option-label="locationLabel" option-value="id" placeholder="Ubicación"/>
        <pv-button type="submit" label="Guardar"/>
      </form>
    </pv-dialog>

    <pv-dialog v-model:visible="assignVisible" header="Asignar equipo" modal class="w-full md:w-25rem">
      <div class="flex flex-column gap-3">
        <pv-select v-model="assignEmployee" :options="iam.employees" option-label="name" option-value="id" placeholder="Empleado" show-clear/>
        <pv-button label="Confirmar" @click="assign"/>
      </div>
    </pv-dialog>
  </div>
</template>
