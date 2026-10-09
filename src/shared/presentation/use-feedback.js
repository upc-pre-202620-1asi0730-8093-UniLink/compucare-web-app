import {useToast} from "primevue";

// Avisos de éxito / error reutilizables en todas las vistas
export function useFeedback() {
    const toast = useToast();
    return {
        ok: (message) => toast.add({severity: 'success', summary: message, life: 3000}),
        fail: (error) => toast.add({
            severity: 'error',
            summary: error?.response?.data?.message ?? error?.message ?? 'Ocurrió un error',
            life: 4000
        })
    };
}
