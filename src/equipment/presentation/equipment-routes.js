const equipmentList = () => import('./views/equipment-list.vue');
const equipmentHistory = () => import('./views/equipment-history.vue');
const locations = () => import('./views/locations.vue');

const equipmentRoutes = [
    {path: '/equipment', name: 'equipment', component: equipmentList, meta: {title: 'Equipos', roles: ['admin']}},
    {path: '/equipment/:id/history', name: 'equipment-history', component: equipmentHistory, meta: {title: 'Historial', roles: ['admin']}},
    {path: '/locations', name: 'locations', component: locations, meta: {title: 'Sedes', roles: ['admin']}}
];

export default equipmentRoutes;
