import axios from "axios";

const platformApi = import.meta.env.VITE_UNILINK_API_URL || '/api/v1';

export class BaseApi {
    #http;

    constructor() {
        this.#http = axios.create({
            baseURL: platformApi,
            headers: {'Content-Type': 'application/json'},
        });
        // Agrega el JWT a cada petición
        this.#http.interceptors.request.use((config) => {
            const token = localStorage.getItem('unilink_token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
        // Si el token venció, vuelve al login
        this.#http.interceptors.response.use((r) => r, (error) => {
            const isAuthCall = error.config?.url?.startsWith('/auth/');
            if (error.response?.status === 401 && !isAuthCall) {
                localStorage.removeItem('unilink_token');
                localStorage.removeItem('unilink_user');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        });
    }

    get http() {
        return this.#http;
    }
}
