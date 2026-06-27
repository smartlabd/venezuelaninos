export type Rol = 'operador_refugio' | 'coordinador_regional' | 'autoridad_legal' | 'administrador'

export type EstadoNino =
  | 'registrado'
  | 'en_busqueda'
  | 'reclamado'
  | 'en_proceso_legal'
  | 'reunificado'
  | 'custodia_institucional'

export type UrgenciaMedica = 'critico' | 'moderado' | 'estable'

export type EstadoPsicoemocional =
  | 'en_evaluacion'
  | 'estable_cooperativo'
  | 'angustiado'
  | 'en_shock'
  | 'disociado'

export type EstadoSolicitud =
  | 'paso_1_solicitud'
  | 'paso_2_identidad_verificada'
  | 'paso_3_vinculo_documentado'
  | 'paso_4_autoridad_aprobada'
  | 'paso_5_entrega_completada'
  | 'rechazada'
  | 'suspendida'

export type Parentesco =
  | 'padre' | 'madre' | 'abuelo_a' | 'tio_a' | 'hermano_a'
  | 'tutor_legal' | 'otro_familiar' | 'vecino_conocido'

export interface Refugio {
  id: string
  nombre: string
  direccion: string
  municipio: string
  estado_venezuela: string
  capacidad_maxima: number
  telefono_principal?: string
  telefono_secundario?: string
  coordinador_nombre: string
  coordinador_cedula?: string
  tiene_medico: boolean
  tiene_psicologo: boolean
  tiene_agua_potable: boolean
  tiene_alimentacion: boolean
  tiene_electricidad: boolean
  tiene_acceso_vehicular: boolean
  notas_operativas?: string
  activo: boolean
  latitud?: number
  longitud?: number
  created_at: string
  updated_at: string
  total_ninos?: number
}

export interface Usuario {
  id: string
  nombre_completo: string
  cedula?: string
  telefono?: string
  rol: Rol
  refugio_id?: string
  activo: boolean
  created_at: string
  refugio?: Refugio
}

export interface Nino {
  id: string
  codigo_emergencia: string
  nombre?: string
  apellido?: string
  nombre_no_identificado: string
  edad_aproximada?: number
  genero: 'masculino' | 'femenino' | 'no_determinado'
  fecha_nacimiento?: string
  descripcion_fisica: string
  color_cabello?: string
  color_ojos?: string
  altura_aproximada_cm?: number
  tiene_cicatrices: boolean
  descripcion_cicatrices?: string
  ropa_al_ingreso?: string
  foto_url?: string
  foto_adicional_1_url?: string
  foto_adicional_2_url?: string
  estado: EstadoNino
  refugio_id: string
  refugio_anterior_id?: string
  urgencia_medica: UrgenciaMedica
  condicion_medica?: string
  alergias_conocidas?: string
  medicamentos_requeridos?: string
  estado_psicoemocional: EstadoPsicoemocional
  notas_medicas?: string
  atendido_por_medico: boolean
  atendido_por_psicologo: boolean
  nombre_padre?: string
  nombre_madre?: string
  nombre_tutor_legal?: string
  telefono_familiar_recordado?: string
  direccion_recordada?: string
  barrio_recordado?: string
  escuela_recordada?: string
  otros_familiares_mencionados?: string
  cedula_numero?: string
  partida_nacimiento_numero?: string
  pasaporte_numero?: string
  tiene_documentos_fisicos: boolean
  registrado_por: string
  registrado_en: string
  ultima_actualizacion_por?: string
  created_at: string
  updated_at: string
  refugio?: Refugio
  registrado_por_usuario?: Usuario
}

export interface SolicitudReunificacion {
  id: string
  nino_id: string
  reclamante_nombre: string
  reclamante_cedula: string
  reclamante_telefono: string
  reclamante_parentesco: Parentesco
  reclamante_parentesco_descripcion?: string
  reclamante_direccion?: string
  reclamante_foto_cedula_url?: string
  reclamante_foto_presencial_url?: string
  paso_actual: 1 | 2 | 3 | 4 | 5
  estado: EstadoSolicitud
  documentos_vinculo?: string[]
  vinculo_verificado_por?: string
  vinculo_verificado_en?: string
  notas_verificacion_vinculo?: string
  numero_resolucion_cpnna?: string
  autorizado_por?: string
  autorizado_en?: string
  notas_autorizacion?: string
  acta_entrega_url?: string
  entrega_completada_por?: string
  entrega_completada_en?: string
  testigo_1_nombre?: string
  testigo_1_cedula?: string
  testigo_2_nombre?: string
  testigo_2_cedula?: string
  motivo_rechazo?: string
  recibida_por: string
  created_at: string
  updated_at: string
  nino?: Nino
  recibida_por_usuario?: Usuario
}

export interface Documento {
  id: string
  entidad_tipo: 'nino' | 'solicitud' | 'refugio'
  entidad_id: string
  tipo_documento: string
  nombre_archivo: string
  url: string
  tamanio_bytes?: number
  subido_por: string
  created_at: string
  subido_por_usuario?: Usuario
}

export interface AuditLogEntry {
  id: string
  accion: string
  entidad_tipo: string
  entidad_id?: string
  usuario_id?: string
  usuario_nombre?: string
  detalles: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface NotaSeguimiento {
  id: string
  nino_id: string
  tipo: 'medica' | 'psicologica' | 'familiar' | 'legal' | 'operativa' | 'general'
  contenido: string
  es_urgente: boolean
  creada_por: string
  created_at: string
  creada_por_usuario?: Usuario
}

export interface Transferencia {
  id: string
  nino_id: string
  refugio_origen_id: string
  refugio_destino_id: string
  motivo: string
  autorizado_por: string
  completada: boolean
  completada_en?: string
  notas?: string
  created_at: string
}

export interface Stats {
  total_ninos: number
  sin_contacto: number
  en_proceso: number
  reunificados: number
  ninos_criticos: number
  total_refugios: number
  total_solicitudes_activas: number
  por_estado: Record<EstadoNino, number>
}

export type NinoFormData = {
  nombre?: string
  apellido?: string
  edad_aproximada?: number
  genero: 'masculino' | 'femenino' | 'no_determinado'
  descripcion_fisica: string
  color_cabello?: string
  color_ojos?: string
  altura_aproximada_cm?: number
  tiene_cicatrices: boolean
  descripcion_cicatrices?: string
  ropa_al_ingreso?: string
  refugio_id: string
  urgencia_medica: UrgenciaMedica
  condicion_medica?: string
  alergias_conocidas?: string
  medicamentos_requeridos?: string
  estado_psicoemocional: EstadoPsicoemocional
  notas_medicas?: string
  atendido_por_medico: boolean
  atendido_por_psicologo: boolean
  nombre_padre?: string
  nombre_madre?: string
  nombre_tutor_legal?: string
  telefono_familiar_recordado?: string
  direccion_recordada?: string
  barrio_recordado?: string
  escuela_recordada?: string
  otros_familiares_mencionados?: string
  cedula_numero?: string
  partida_nacimiento_numero?: string
  pasaporte_numero?: string
  tiene_documentos_fisicos: boolean
}
