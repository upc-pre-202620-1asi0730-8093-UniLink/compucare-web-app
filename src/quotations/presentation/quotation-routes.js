const quotations = () => import('./views/quotations.vue');

const quotationRoutes = [
    {
        path: '/quotations',
        name: 'quotations',
        component: quotations,
        meta: {
            title: 'Cotizaciones',
            roles: ['admin', 'company_manager', 'technician', 'sysadmin']
        }
    }
];

export default quotationRoutes;
