import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Heart, FileText } from 'lucide-react'
import { getNombreCompleto, formatFecha, formatRelativo } from '@/lib/utils/format'
import { ESTADO_NINO_COLORS, ESTADO_NINO_LABELS, URGENCIA_COLORS, URGENCIA_LABELS, ROL_LABELS } from '@/lib/utils/roles'

export default async function NinoPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  const [
    { data: nino },
    { data: solicitudes },
    { data: notas },
    { data: documentos },
    { data: auditEntries },
  ] = await Promise.all([
    supabase.from('ninos').select('*, refugio:refugios(*), registrado_por_usuario:usuarios!registrado_por(nombre_completo, rol)').eq('id', params.id).single(),
    supabase.from('solicitudes_reunificacion').select('*').eq('nino_id', params.id).order('created_at', { ascending: false }),
    supabase.from('notas_seguimiento').select('*, creada_por_usuario:usuarios!creada_por(nombre_completo)').eq('nino_id', params.id).order('created_at', { ascending: false }),
    supabase.from('documentos').select('*').eq('entidad_tipo', 'nino').eq('entidad_id', params.id).order('created_at', { ascending: false }),
    supabase.from('audit_log').select('*').eq('entidad_id', params.id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!nino) notFound()

  const nombre = getNombreCompleto(nino)
  const refugio = nino.refugio as any
  const registradoPor = nino.registrado_por_usuario as any

  const canEdit = ['coordinador_regional', 'administrador', 'operador_refugio'].includes(usuario?.rol || '')

  const pasoLabels: Record<string, string> = {
    paso_1_solicitud: 'Paso 1 — Solicitud',
    paso_2_identidad_verificada: 'Paso 2 — Identidad',
    paso_3_vinculo_documentado: 'Paso 3 — Vínculo',
    paso_4_autoridad_aprobada: 'Paso 4 — Autorizado',
    paso_5_entrega_completada: 'Completado ✓',
    rechazada: 'Rechazada',
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/ninos" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900">{nombre}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${URGENCIA_COLORS[nino.urgencia_medica]}`}>
              {URGENCIA_LABELS[nino.urgencia_medica]}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_NINO_COLORS[nino.estado]}`}>
              {ESTADO_NINO_LABELS[nino.estado]}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {nino.codigo_emergencia} · {refugio?.nombre} · Registrado {formatRelativo(nino.registrado_en)}
          </p>
        </div>
        {canEdit && (
          <Link href={`/ninos/${nino.id}/editar`} className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Foto + datos básicos */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Datos personales</h2>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {nino.foto_url
                  ? <img src={nino.foto_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-semibold text-slate-400">{nombre[0]?.toUpperCase()}</span>
                }
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
                {[
                  ['Nombre', nino.nombre || '—'],
                  ['Apellido', nino.apellido || '—'],
                  ['Edad aprox.', nino.edad_aproximada ? `${nino.edad_aproximada} años` : '—'],
                  ['Género', nino.genero === 'masculino' ? 'Masculino' : nino.genero === 'femenino' ? 'Femenino' : 'No determinado'],
                  ['Cabello', nino.color_cabello || '—'],
                  ['Ojos', nino.color_ojos || '—'],
                  ['Altura', nino.altura_aproximada_cm ? `${nino.altura_aproximada_cm} cm` : '—'],
                  ['Ropa al ingreso', nino.ropa_al_ingreso || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="text-sm text-slate-800 font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            {nino.descripcion_fisica && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 mb-1">Descripción física</p>
                <p className="text-sm text-slate-700">{nino.descripcion_fisica}</p>
              </div>
            )}
            {nino.tiene_cicatrices && nino.descripcion_cicatrices && (
              <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs font-medium text-amber-600 mb-1">Cicatrices / marcas</p>
                <p className="text-sm text-amber-900">{nino.descripcion_cicatrices}</p>
              </div>
            )}
          </div>

          {/* Salud */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Salud</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Estado psicoemocional', nino.estado_psicoemocional?.replace(/_/g, ' ')],
                ['Condición médica', nino.condicion_medica || '—'],
                ['Alergias', nino.alergias_conocidas || '—'],
                ['Medicamentos', nino.medicamentos_requeridos || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-400">{k}</p>
                  <p className="text-sm text-slate-800 capitalize">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <span className={`text-xs px-2.5 py-1 rounded-full ${nino.atendido_por_medico ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {nino.atendido_por_medico ? '✓' : '✗'} Médico
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${nino.atendido_por_psicologo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {nino.atendido_por_psicologo ? '✓' : '✗'} Psicólogo
              </span>
            </div>
            {nino.notas_medicas && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 mb-1">Notas médicas</p>
                <p className="text-sm text-slate-700">{nino.notas_medicas}</p>
              </div>
            )}
          </div>

          {/* Info familiar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Información familiar</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Padre', nino.nombre_padre || '—'],
                ['Madre', nino.nombre_madre || '—'],
                ['Tutor legal', nino.nombre_tutor_legal || '—'],
                ['Teléfono recordado', nino.telefono_familiar_recordado || '—'],
                ['Barrio/sector', nino.barrio_recordado || '—'],
                ['Escuela', nino.escuela_recordada || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-400">{k}</p>
                  <p className="text-sm text-slate-800 font-medium">{v}</p>
                </div>
              ))}
            </div>
            {nino.direccion_recordada && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Dirección recordada</p>
                <p className="text-sm text-slate-700">{nino.direccion_recordada}</p>
              </div>
            )}
            {nino.otros_familiares_mencionados && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Otros familiares mencionados</p>
                <p className="text-sm text-slate-700">{nino.otros_familiares_mencionados}</p>
              </div>
            )}
          </div>

          {/* Documentos */}
          {(nino.cedula_numero || nino.partida_nacimiento_numero || nino.pasaporte_numero) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Documentación</h2>
              <div className="grid grid-cols-3 gap-3">
                {[['Cédula', nino.cedula_numero], ['Partida de nac.', nino.partida_nacimiento_numero], ['Pasaporte', nino.pasaporte_numero]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">{k}</p>
                    <p className="text-sm text-green-900 font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas de seguimiento */}
          {notas && notas.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Notas de seguimiento</h2>
              <div className="space-y-3">
                {notas.map((nota: any) => (
                  <div key={nota.id} className={`p-3 rounded-lg border ${nota.es_urgente ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        nota.tipo === 'medica' ? 'bg-red-100 text-red-700' :
                        nota.tipo === 'legal' ? 'bg-purple-100 text-purple-700' :
                        nota.tipo === 'psicologica' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {nota.tipo}
                      </span>
                      <span className="text-xs text-slate-400">{formatRelativo(nota.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{nota.contenido}</p>
                    <p className="text-xs text-slate-400 mt-1">Por: {nota.creada_por_usuario?.nombre_completo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar derecho */}
        <div className="space-y-4">
          {/* Reunificación */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Reunificación</h2>
            {solicitudes && solicitudes.length > 0 ? (
              <div className="space-y-2">
                {solicitudes.map((s: any) => (
                  <Link key={s.id} href={`/reunificacion/${s.id}`} className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <p className="text-xs font-medium text-slate-800">{s.reclamante_nombre}</p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{s.reclamante_parentesco?.replace('_', '/')}</p>
                    <p className="text-xs text-blue-600 mt-1">{pasoLabels[s.estado] || s.estado}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-3">Sin solicitudes activas</p>
            )}
            {nino.estado !== 'reunificado' && (
              <Link
                href={`/reunificacion/nueva?nino_id=${nino.id}`}
                className="block w-full text-center py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors mt-3"
              >
                + Nueva solicitud
              </Link>
            )}
          </div>

          {/* Refugio */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Refugio actual</h2>
            <p className="text-sm font-medium text-slate-900">{refugio?.nombre}</p>
            <p className="text-xs text-slate-500 mt-0.5">{refugio?.municipio}, {refugio?.estado_venezuela}</p>
            {refugio?.telefono_principal && (
              <p className="text-xs text-slate-500 mt-1">{refugio.telefono_principal}</p>
            )}
            {refugio?.coordinador_nombre && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">Coordinador</p>
                <p className="text-xs text-slate-700">{refugio.coordinador_nombre}</p>
              </div>
            )}
          </div>

          {/* Registro */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Cadena de custodia</h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-400">Registrado por</p>
                <p className="text-xs text-slate-700 font-medium">{registradoPor?.nombre_completo}</p>
                <p className="text-xs text-slate-400">{registradoPor?.rol ? ROL_LABELS[registradoPor.rol as any] : ''}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Fecha de ingreso</p>
                <p className="text-xs text-slate-700">{formatFecha(nino.registrado_en)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Código de emergencia</p>
                <p className="text-sm font-mono font-bold text-red-700">{nino.codigo_emergencia}</p>
              </div>
            </div>
          </div>

          {/* Audit */}
          {auditEntries && auditEntries.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Historial</h2>
              <div className="space-y-2">
                {auditEntries.slice(0, 6).map((e: any) => (
                  <div key={e.id} className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-700">{e.accion.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400">{formatRelativo(e.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
