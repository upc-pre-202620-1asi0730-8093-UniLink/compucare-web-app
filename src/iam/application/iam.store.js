import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";

const iamApi = new IamApi();
const homeByRole = {admin: '/dashboard', company_manager: '/dashboard', employee: '/my-tickets', technician: '/technician', sysadmin: '/admin/tickets'};

const useIamStore = defineStore('iam', () => {
    const token = ref(localStorage.getItem('unilink_token'));
    const user = ref(JSON.parse(localStorage.getItem('unilink_user') || 'null'));
    const employees = ref([]);
    const technicians = ref([]);

    const isAuthenticated = computed(() => !!token.value);
    const role = computed(() => user.value?.role);
    const homeRoute = computed(() => homeByRole[role.value] ?? '/profile');

    function persist() {
        localStorage.setItem('unilink_token', token.value);
        localStorage.setItem('unilink_user', JSON.stringify(user.value));
    }

    async function signIn(credentials) {
        const {data} = await iamApi.login(credentials);
        token.value = data.token;
        user.value = data.user;
        persist();
    }

    function signOut() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('unilink_token');
        localStorage.removeItem('unilink_user');
    }

    const register = (payload) => iamApi.register(payload);
    const forgotPassword = async (email) => (await iamApi.forgotPassword(email)).data;
    const resetPassword = (t, password) => iamApi.resetPassword(t, password);

    async function fetchEmployees() {
        employees.value = (await iamApi.getEmployees()).data;
    }

    async function createEmployee(employee) {
        const {data} = await iamApi.createEmployee(employee);
        employees.value = [...employees.value, data];
        return data;
    }

    async function fetchTechnicians() {
        technicians.value = (await iamApi.getTechnicians()).data;
    }

    async function updateProfile(changes) {
        const {data} = await iamApi.updateProfile(user.value.id, changes);
        user.value = data;
        persist();
    }

    const changePassword = (current, next) => iamApi.changePassword(user.value.id, current, next);

    return {
        token, user, employees, technicians, isAuthenticated, role, homeRoute,
        signIn, signOut, register, forgotPassword, resetPassword,
        fetchEmployees, createEmployee, fetchTechnicians, updateProfile, changePassword
    };
});

export default useIamStore;
