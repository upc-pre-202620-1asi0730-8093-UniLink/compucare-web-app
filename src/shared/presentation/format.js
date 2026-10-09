// Utilidades de formato compartidas por las vistas

export const roleLabels = {
    employee: 'Empleado',
    technician: 'Técnico de soporte',
    admin: 'Administrador de empresa',
    company_manager: 'Administrador de empresa',
    sysadmin: 'Administrador UniLink'
};

export function formatDate(value, withTime = true) {
    if (!value) return 'Fecha no disponible';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        ...(withTime ? {timeStyle: 'short'} : {})
    }).format(date);
}

export function formatMoney(value) {
    return new Intl.NumberFormat('es-PE', {style: 'currency', currency: 'PEN'}).format(Number(value ?? 0));
}
