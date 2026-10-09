import {defineStore} from "pinia";
import {ref} from "vue";
import {TicketApi} from "../infrastructure/ticket-api.js";

const api = new TicketApi();

const useTicketStore = defineStore('tickets', () => {
    const tickets = ref([]);

    async function fetchTickets() {
        tickets.value = (await api.getTickets()).data;
    }

    // Cada acción modifica el ticket en el servidor y recarga la lista
    const run = (call) => async (...args) => { await call(...args); await fetchTickets(); };

    return {
        tickets, fetchTickets,
        createTicket: run((r) => api.createTicket(r)),
        cancelTicket: run((id) => api.cancel(id)),
        assignTicket: run((id, techId) => api.assign(id, techId)),
        startDiagnosis: run((id) => api.start(id)),
        closeTicket: run((id, r) => api.diagnose(id, r))
    };
});

export default useTicketStore;
