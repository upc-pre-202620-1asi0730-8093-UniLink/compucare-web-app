import {defineStore} from "pinia";
import {ref} from "vue";
import {SubscriptionApi} from "../infrastructure/subscription-api.js";

const api = new SubscriptionApi();

const useSubscriptionStore = defineStore('subscriptions', () => {
    const plans = ref([]);
    const balance = ref(null);
    const maintenances = ref([]);

    async function fetchPlans() {
        plans.value = (await api.getPlans()).data;
    }

    async function fetchBalance() {
        try {
            balance.value = (await api.getBalance()).data;
        } catch (e) {
            if (e.response?.status === 404) balance.value = null; else throw e;
        }
    }

    async function subscribe(planId, billing) {
        balance.value = (await api.subscribe(planId, billing)).data;
    }

    async function renew() {
        balance.value = (await api.renew()).data;
    }

    async function fetchMaintenances() {
        maintenances.value = (await api.getMaintenances()).data;
    }

    async function scheduleMaintenance(resource) {
        await api.scheduleMaintenance(resource);
        await Promise.all([fetchMaintenances(), fetchBalance()]);
    }

    return {plans, balance, maintenances, fetchPlans, fetchBalance, subscribe, renew, fetchMaintenances, scheduleMaintenance};
});

export default useSubscriptionStore;
