import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

export class QuotationApi extends BaseApi {
    #quotes = new BaseEndpoint(this, '/quotes');

    getQuotes() { return this.#quotes.getAll(); }
    createQuote(resource) { return this.#quotes.create(resource); }
    updateStatus(id, status) { return this.http.put(`/quotes/${id}/status`, {status}); }
    pay(id, card) { return this.http.post(`/quotes/${id}/pay`, card); }
}
