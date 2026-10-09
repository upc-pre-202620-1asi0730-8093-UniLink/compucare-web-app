const equipments = () => import('./views/equipments.vue');
const locations = () => import('./views/locations.vue');

const equipmentRoutes = [
    {
        path: '/equipments',
        name: 'equipments',
        component: equipments,
        meta: {title: 'Equipos', roles: ['admin', 'company_manager', 'employee']}
    },
    {
        path: '/locations',
        name: 'locations',
        component: locations,
        meta: {title: 'Sedes', roles: ['admin', 'company_manager']}
    }
];

export default equipmentRoutes;
