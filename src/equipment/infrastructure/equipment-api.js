import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

export class EquipmentApi extends BaseApi {
    #equipments = new BaseEndpoint(this, '/equipments');
    #locations = new BaseEndpoint(this, '/locations');

    getEquipments(filters) { return this.#equipments.getAll(filters); }
    createEquipment(resource) { return this.#equipments.create(resource); }
    assignEquipment(id, employeeId) { return this.http.put(`/equipments/${id}/assign`, {employeeId}); }
    getHistory(id) { return this.http.get(`/equipments/${id}/history`); }

    getLocations() { return this.#locations.getAll(); }
    createLocation(resource) { return this.#locations.create(resource); }
    setLocationActive(id, active) { return this.http.patch(`/locations/${id}`, {active}); }
}
