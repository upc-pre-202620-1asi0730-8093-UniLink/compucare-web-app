import {defineStore} from "pinia";
import {ref} from "vue";
import {EquipmentApi} from "../infrastructure/equipment-api.js";

const api = new EquipmentApi();

const useEquipmentStore = defineStore('equipment', () => {
    const equipments = ref([]);
    const locations = ref([]);
    const history = ref(null);

    async function fetchEquipments(filters = {}) {
        const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== null && v !== ''));
        equipments.value = (await api.getEquipments(clean)).data;
    }

    async function createEquipment(resource) {
        await api.createEquipment(resource);
        await fetchEquipments();
    }

    async function assignEquipment(id, employeeId) {
        await api.assignEquipment(id, employeeId);
        await fetchEquipments();
    }

    async function fetchHistory(id) {
        history.value = (await api.getHistory(id)).data;
    }

    async function fetchLocations() {
        locations.value = (await api.getLocations()).data;
    }

    async function createLocation(resource) {
        await api.createLocation(resource);
        await fetchLocations();
    }

    async function setLocationActive(id, active) {
        await api.setLocationActive(id, active);
        await fetchLocations();
    }

    return {equipments, locations, history, fetchEquipments, createEquipment, assignEquipment,
        fetchHistory, fetchLocations, createLocation, setLocationActive};
});

export default useEquipmentStore;
