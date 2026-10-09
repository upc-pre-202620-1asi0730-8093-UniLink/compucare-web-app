<script setup>
import {onMounted} from "vue";
import {useRoute} from "vue-router";
import useEquipmentStore from "../../application/equipment.store.js";
import {useFeedback} from "../../../shared/presentation/use-feedback.js";

const route = useRoute();
const store = useEquipmentStore();
const {fail} = useFeedback();

onMounted(() => store.fetchHistory(route.params.id).catch(fail));
</script>

<template>
  <div class="p-4" v-if="store.history">
    <router-link to="/equipment">← Volver al inventario</router-link>
    <h1>{{ store.history.equipment.code }} · {{ store.history.equipment.name }}</h1>
    <p class="text-color-secondary">Serie {{ store.history.equipment.serialNumber }} · {{ store.history.equipment.type }}</p>

    <h2>Historial de servicio</h2>
    <pv-data-table :value="store.history.tickets" striped-rows>
      <pv-column header="Ticket" field="id"/>
      <pv-column header="Fecha" field="createdAt"/>
      <pv-column header="Categoría" field="category"/>
      <pv-column header="Estado" field="status"/>
      <pv-column header="Diagnóstico" field="diagnosis"/>
      <pv-column header="Horas" field="hours"/>
      <pv-column header="Repuestos">
        <template #body="{data}">
          <div v-for="q in data.quotes" :key="q.id">
            <span v-for="i in q.items" :key="i.description">{{ i.description }} (S/ {{ i.cost }}) </span>
          </div>
        </template>
      </pv-column>
    </pv-data-table>

    <h2>Mantenimientos preventivos</h2>
    <pv-data-table :value="store.history.maintenances" striped-rows>
      <pv-column header="Fecha" field="date"/>
      <pv-column header="Hora" field="time"/>
      <pv-column header="Estado" field="status"/>
    </pv-data-table>

    <h2>Historial de asignaciones</h2>
    <pv-data-table :value="store.history.assignments" striped-rows>
      <pv-column header="Fecha" field="at"/>
      <pv-column header="Empleado (ID)" field="employeeId"/>
    </pv-data-table>
  </div>
</template>
