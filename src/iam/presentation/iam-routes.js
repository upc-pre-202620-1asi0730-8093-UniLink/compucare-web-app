
const signIn = () => import('./views/sign-in.vue')
const signUp = () => import('./views/sign-up.vue')
const forgotPassword = () => import('./views/forgot-password.vue')
const employees = () => import('./views/employees.vue')
const profile = () => import('./views/profile.vue')

const iamRoutes = [
    {
        path: '/login',
        name: 'sign-in',
        component: signIn,
        meta: {
            title: 'Ingresar',
            public: true,
        },
    },
    {
        path: '/sign-up',
        name: 'sign-up',
        component: signUp,
        meta: {
            title: 'Registro',
            public: true,
        },
    },
    {
        path: '/forgot-password',
        name: 'forgot-password',
        component: forgotPassword,
        meta: {
            title: 'Recuperar contraseña',
            public: true,
        },
    },
    {
        path: '/employees',
        name: 'employees',
        component: employees,
        meta: {
            title: 'Empleados',
            roles: ['company_manager', 'admin'],
        },
    },
    {
        path: '/profile',
        name: 'profile',
        component: profile,
        meta: {
            title: 'Perfil',
        },
    },
]

export default iamRoutes
