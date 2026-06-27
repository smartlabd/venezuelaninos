import type { Rol } from '@/lib/types/database'

export const PERMISOS = {
  puede_registrar_ninos: (rol: Rol) =>
    ['operador_refugio', 'coordinador_regional', 'administrador'].includes(rol),
  puede_ver_todos_refugios: (rol: Rol) =>
    ['coordinador_regional', 'autoridad_legal', 'administrador'].includes(rol),
  puede_autorizar_entrega: (rol: Rol) =>
    ['autoridad_legal', 'administrador'].includes(rol),
  puede_completar_paso_4: (rol: Rol) =>
    rol === 'autoridad_legal' || rol === 'administrador',
  puede_gestionar_usuarios: (rol: Rol) =>
    rol === 'administrador',
  puede_ver_audit_log: (rol: Rol) =>
    ['coordinador_regional', 'autoridad_legal', 'administrador'].includes(rol),
  puede_transferir_ninos: (rol: Rol) =>
    ['coordinador_regional', 'administrador'].includes(rol),
  puede_crear_refugios: (rol: Rol) =>
    ['coordinador_regional', 'administrador'].includes(rol),
}

export const ROL_LABELS: Record<Rol, string> = {
  operador_refugio: 'Operador de Refugio',
  coordinador_regional: 'Coordinador Regional',
  autoridad_legal: 'Autoridad Legal (CPNNA)',
  administrador: 'Administrador',
}

export const ROL_COLORS: Record<Rol, string> = {
  operador_refugio: 'bg-blue-100 text-blue-800 border-blue-200',
  coordinador_regional: 'bg-purple-100 text-purple-800 border-purple-200',
  autoridad_legal: 'bg-amber-100 text-amber-800 border-amber-200',
  administrador: 'bg-slate-100 text-slate-700 border-slate-200',
}

export const ESTADO_NINO_LABELS: Record<string, string> = {
  registrado: 'Registrado',
  en_busqueda: 'En búsqueda',
  reclamado: 'Reclamado',
  en_proceso_legal: 'Proceso legal',
  reunificado: 'Reunificado',
  custodia_institucional: 'Custodia institucional',
}

export const ESTADO_NINO_COLORS: Record<string, string> = {
  registrado: 'bg-slate-100 text-slate-700',
  en_busqueda: 'bg-blue-100 text-blue-800',
  reclamado: 'bg-amber-100 text-amber-800',
  en_proceso_legal: 'bg-purple-100 text-purple-800',
  reunificado: 'bg-green-100 text-green-800',
  custodia_institucional: 'bg-orange-100 text-orange-800',
}

export const URGENCIA_LABELS: Record<string, string> = {
  critico: 'Crítico',
  moderado: 'Moderado',
  estable: 'Estable',
}

export const URGENCIA_COLORS: Record<string, string> = {
  critico: 'bg-red-100 text-red-800 border-red-200',
  moderado: 'bg-amber-100 text-amber-800 border-amber-200',
  estable: 'bg-green-100 text-green-800 border-green-200',
}

export const PASO_LABELS: Record<number, string> = {
  1: 'Solicitud registrada',
  2: 'Identidad verificada',
  3: 'Vínculo documentado',
  4: 'Autorización CPNNA',
  5: 'Entrega completada',
}

export const PARENTESCO_LABELS: Record<string, string> = {
  padre: 'Padre',
  madre: 'Madre',
  abuelo_a: 'Abuelo/a',
  tio_a: 'Tío/a',
  hermano_a: 'Hermano/a',
  tutor_legal: 'Tutor legal',
  otro_familiar: 'Otro familiar',
  vecino_conocido: 'Vecino conocido',
}
