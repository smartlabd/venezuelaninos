import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatFecha(fecha: string | Date) {
  return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es })
}

export function formatFechaCorta(fecha: string | Date) {
  return format(new Date(fecha), "dd/MM/yyyy", { locale: es })
}

export function formatRelativo(fecha: string | Date) {
  return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es })
}

export function getNombreCompleto(nino: { nombre?: string; apellido?: string; nombre_no_identificado?: string }) {
  if (nino.nombre || nino.apellido) {
    return [nino.nombre, nino.apellido].filter(Boolean).join(' ')
  }
  return nino.nombre_no_identificado || 'Sin identificar'
}

export function getIniciales(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
