import {BaseApi} from "../../shared/infrastructure/base-api.js";

export class IamApi extends BaseApi {
    login(credentials) { return this.http.post('/auth/login', credentials); }
    register(payload) { return this.http.post('/auth/register', payload); }
    forgotPassword(email) { return this.http.post('/auth/forgot-password', {email}); }
    resetPassword(token, password) { return this.http.post('/auth/reset-password', {token, password}); }
    getEmployees() { return this.http.get('/employees'); }
    createEmployee(employee) { return this.http.post('/employees', employee); }
    getTechnicians() { return this.http.get('/technicians'); }
    updateProfile(id, data) { return this.http.patch(`/users/${id}`, data); }
    changePassword(id, currentPassword, newPassword) {
        return this.http.put(`/users/${id}/password`, {currentPassword, newPassword});
    }
}
