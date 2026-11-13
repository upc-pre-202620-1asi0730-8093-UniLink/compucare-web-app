// Utilidades de formato compartidas por las vistas

export const roleLabels = {
    employee: 'Empleado',
    technician: 'Técnico de soporte',
    admin: 'Administrador de empresa',
    company_manager: 'Administrador de empresa',
    sysadmin: 'Administrador UniLink'
};

function currentLocale() {
    return document.documentElement.lang === 'en' ? 'en-US' : 'es-PE';
}

export function formatDate(value, withTime = true) {
    if (!value) return 'Fecha no disponible';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat(currentLocale(), {
        dateStyle: 'medium',
        ...(withTime ? {timeStyle: 'short'} : {})
    }).format(date);
}

export function formatMoney(value) {
    return new Intl.NumberFormat(currentLocale(), {style: 'currency', currency: 'PEN'}).format(Number(value ?? 0));
}
