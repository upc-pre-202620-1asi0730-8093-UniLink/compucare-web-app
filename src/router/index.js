
import { createRouter, createWebHistory } from 'vue-router'
import iamRoutes from '../iam/presentation/iam-routes.js'
import useIamStore from '../iam/application/iam.store.js'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        ...iamRoutes,
        {
            path: '/:pathMatch(.*)*',
            redirect: '/login'
        }
    ]
})

router.beforeEach((to) => {
    const iamStore = useIamStore()

    const isPublic = to.meta.public === true
    const isAuthenticated = iamStore.isAuthenticated
    const userRole = iamStore.role

    // Las páginas públicas pueden visitarse sin sesión.
    if (isPublic) {
        if (isAuthenticated && to.path === '/login') {
            const destination = iamStore.homeRoute

            // Mientras no existan los paneles, usar perfil.
            if (
                destination !== to.path &&
                router.resolve(destination).matched.some(
                    (record) => record.path !== '/:pathMatch(.*)*'
                )
            ) {
                return destination
            }

            return '/profile'
        }

        return true
    }

    // Exigir inicio de sesión para las páginas privadas.
    if (!isAuthenticated) {
        return {
            path: '/login',
            query: { redirect: to.fullPath }
        }
    }

    // Comprobar permisos según el rol del usuario.
    const allowedRoles = to.meta.roles

    if (
        Array.isArray(allowedRoles) &&
        !allowedRoles.includes(userRole)
    ) {
        return '/profile'
    }

    return true
})

router.afterEach((to) => {
    document.title = `${to.meta.title || 'Plataforma'} | CompuCare`
})

export default router
