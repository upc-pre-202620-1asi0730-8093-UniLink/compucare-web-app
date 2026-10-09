
import { createRouter, createWebHistory } from 'vue-router'
import iamRoutes from '../iam/presentation/iam-routes.js'

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

export default router
