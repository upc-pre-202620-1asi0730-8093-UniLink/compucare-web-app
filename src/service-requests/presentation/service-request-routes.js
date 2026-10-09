const myTickets = () => import('./views/my-tickets.vue');
const adminTickets = () => import('./views/admin-tickets.vue');
const technicianTickets = () => import('./views/technician-tickets.vue');

const serviceRequestRoutes = [
    {path: '/my-tickets', name: 'my-tickets', component: myTickets, meta: {title: 'Mis Tickets', roles: ['employee']}},
    {path: '/admin/tickets', name: 'admin-tickets', component: adminTickets, meta: {title: 'Tickets', roles: ['sysadmin']}},
    {path: '/technician', name: 'technician', component: technicianTickets, meta: {title: 'Mis Asignaciones', roles: ['technician']}}
];

export default serviceRequestRoutes;
