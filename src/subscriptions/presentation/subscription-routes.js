const dashboard = () => import('./views/dashboard.vue');
const subscription = () => import('./views/subscription.vue');
const maintenances = () => import('./views/maintenances.vue');

const managers = ['admin', 'company_manager'];

const subscriptionRoutes = [
    {
        path: '/dashboard',
        name: 'dashboard',
        component: dashboard,
        meta: {title: 'Panel', roles: managers}
    },
    {
        path: '/subscription',
        name: 'subscription',
        component: subscription,
        meta: {title: 'Suscripción', roles: managers}
    },
    {
        path: '/maintenances',
        name: 'maintenances',
        component: maintenances,
        meta: {title: 'Mantenimientos', roles: managers}
    }
];

export default subscriptionRoutes;
