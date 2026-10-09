import {BaseApi} from "../../shared/infrastructure/base-api.js";

export class SubscriptionApi extends BaseApi {
    getPlans() { return this.http.get('/plans'); }
    getBalance() { return this.http.get('/subscriptions/balance'); }
    subscribe(planId, billing) { return this.http.post('/subscriptions', {planId, billing}); }
    renew() { return this.http.post('/subscriptions/renew'); }
    getMaintenances() { return this.http.get('/maintenances'); }
    scheduleMaintenance(resource) { return this.http.post('/maintenances', resource); }
}
