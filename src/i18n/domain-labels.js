import { useI18n } from 'vue-i18n'

/**
 * Presentation-only localization for values returned by the API.
 * Never translate the identifiers sent back to the server.
 */
const serviceStatuses = {
  'Pendiente de Asignación': 'pending',
  'Asignado': 'assigned',
  'En Diagnóstico': 'diagnosis',
  'En Proceso': 'progress',
  'Atendido': 'attended',
  'Resuelto': 'resolved',
  'Completado': 'completed',
  'Cerrado': 'closed',
  'Cancelado': 'cancelled'
}
const quotationStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid'
}
const equipmentStatuses = {
  'Operativo': 'operational',
  'En Reparación': 'repair'
}
const categories = {
  'Hardware': 'hardware',
  'Software': 'software',
  'Red': 'network',
  'Impresión': 'printing',
  'Otro': 'other'
}

export function useDomainLabels() {
  const { t } = useI18n({ useScope: 'global' })
  const label = (namespace, dictionary, value) => {
    if (value == null || value === '') return t('domain.unspecified')
    const key = dictionary[String(value)]
    return key ? t(`domain.${namespace}.${key}`) : String(value)
  }

  return {
    ticketStatusLabel: status => label('ticket', serviceStatuses, status),
    quotationStatusLabel: status => label('quotation', quotationStatuses, status),
    equipmentStatusLabel: status => label('equipment', equipmentStatuses, status),
    categoryLabel: category => label('category', categories, category)
  }
}
