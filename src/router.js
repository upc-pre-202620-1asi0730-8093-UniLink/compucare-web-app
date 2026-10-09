import {createRouter, createWebHistory} from "vue-router";
import Home from "./shared/presentation/views/home.vue";
import iamRoutes from "./iam/presentation/iam-routes.js";
import equipmentRoutes from "./equipment/presentation/equipment-routes.js";
import subscriptionRoutes from "./subscriptions/presentation/subscription-routes.js";
import serviceRequestRoutes from "./service-requests/presentation/service-request-routes.js";
import quotationRoutes from "./quotations/presentation/quotation-routes.js";

const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');
const notifications = () => import('./shared/presentation/views/notifications.vue');

const routes = [
    {path: '/home', name: 'home', component: Home, meta: {title: 'Inicio', public: true}},
    {path: '/notifications', name: 'notifications', component: notifications, meta: {title: 'Notificaciones'}},
    ...iamRoutes,
    ...equipmentRoutes,
    ...subscriptionRoutes,
    ...serviceRequestRoutes,
    ...quotationRoutes,
    {path: '/', redirect: '/home'},
    {path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: {title: 'Página no encontrada', public: true}}
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

// Guard de autenticación y de rol (US-01). Lee la sesión directo de localStorage para no depender del store.
const homeByRole = {admin: '/dashboard', employee: '/my-tickets', technician: '/technician', sysadmin: '/admin/tickets'};

router.beforeEach((to) => {
    document.title = `UniLink - ${to.meta['title'] ?? ''}`;
    if (to.meta['public']) return true;
    const token = localStorage.getItem('unilink_token');
    const user = JSON.parse(localStorage.getItem('unilink_user') || 'null');
    if (!token || !user) return {name: 'sign-in'};
    const roles = to.meta['roles'];
    if (roles && !roles.includes(user.role)) return homeByRole[user.role] ?? '/home';
    return true;
});

export default router;
