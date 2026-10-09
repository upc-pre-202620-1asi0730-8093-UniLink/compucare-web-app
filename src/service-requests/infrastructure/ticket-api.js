import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

export class TicketApi extends BaseApi {
    #tickets = new BaseEndpoint(this, '/tickets');

    getTickets() { return this.#tickets.getAll(); }
    createTicket(resource) { return this.#tickets.create(resource); }
    cancel(id) { return this.http.put(`/tickets/${id}/cancel`); }
    assign(id, technicianId) { return this.http.put(`/tickets/${id}/assign`, {technicianId}); }
    start(id) { return this.http.put(`/tickets/${id}/start`); }
    diagnose(id, resource) { return this.http.put(`/tickets/${id}/diagnosis`, resource); }
}
