import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Circle, Lock } from 'lucide-react'
import { getNombreCompleto, formatFecha } from '@/lib/utils/format'
import { PARENTESCO_LABELS } from '@/lib/utils/roles'
import PasoActions from '@/components/reunificacion/PasoActions'

const PASO_INFO = [
  { num: 1, label: 'Solicitud registrada', desc: 'Reclamante identificado y solicitud recibida.' },
  { num: 2, label: 'Identidad del reclamante', desc: 'Cédula cotejada presencialmente.' },
  { num: 3, label: 'Vínculo familiar documentado', desc: 'Al menos 2 documentos de parentesco verificados.' },
  { num: 4, label: 'Autorización CPNNA', desc: 'Resolución oficial emitida por autoridad legal.' },
  { num: 5, label: 'Entrega formal completada', desc: 'Acta firmada por reclamante, operador y funcionario CPNNA.' },
]

export default async function SolicitudPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol, refugio_id').eq('id', user!.id).single()

  const { data: solicitud } = await supabase
    .from('solicitudes_reunificacion')
    .select('*, nino:ninos(*, refugio:refugios(nombre))')
    .eq('id', params.id)
    .single()

  if (!solicitud) notFound()

  const nino = solicitud.nino as any
  const nombre = nino ? getNombreCompleto(nino) : '—'
  const paso = solicitud.paso_actual

  const canAdvancePaso4 = ['autoridad_legal', 'administrador'].includes(usuario?.rol || '')
  const canAdvanceOthers = ['operador_refugio', 'coordinador_regional', 'autoridad_legal', 'administrador'].includes(usuario?.rol || '')
  const isCompleted = solicitud.estado === 'paso_5_entrega_completada'
  const isRejected = solicitud.estado === 'rechazada'

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/reunificacion" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Reunificación — {nombre}</h1>
          <p className="text-sm text-slate-500">{nino?.codigo_emergencia} · {(nino?.refugio as any)?.nombre}</p>
        </div>
      </div>

      {isRejected && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">Solicitud rechazada</p>
          {solicitud.motivo_rechazo && <p className="text-sm text-red-700 mt-1">{solicitud.motivo_rechazo}</p>}
        </div>
      )}

      {/* Aviso legal */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-xs text-red-700">
          <strong>Protocolo LOPNNA.</strong> La entrega de menores sin completar los 5 pasos es ilegal (Art. 272). Cada paso queda registrado de forma permanente e inmutable.
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="space-y-4">
          {PASO_INFO.map((info) => {
            const done = paso > info.num || isCompleted
            const current = paso === info.num && !isCompleted && !isRejected
            const locked = paso < info.num

            return (
              <div key={info.num} className={`flex gap-4 p-3 rounded-lg transition-colors ${current ? 'bg-red-50 border border-red-200' : done ? 'bg-green-50' : 'bg-slate-50'}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {done ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : current ? (
                    <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-red-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600">{info.num}</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                      <span className="text-xs text-slate-400">{info.num}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${done ? 'text-green-800' : current ? 'text-red-800' : 'text-slate-400'}`}>
                    {info.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${done ? 'text-green-600' : current ? 'text-red-600' : 'text-slate-400'}`}>
                    {info.desc}
                  </p>

                  {/* Datos por paso */}
                  {info.num === 2 && done && solicitud.vinculo_verificado_en && (
                    <p className="text-xs text-green-600 mt-1">✓ Verificado el {formatFecha(solicitud.vinculo_verificado_en)}</p>
                  )}
                  {info.num === 3 && done && solicitud.documentos_vinculo && (
                    <p className="text-xs text-green-600 mt-1">✓ Documentos: {solicitud.documentos_vinculo.join(', ')}</p>
                  )}
                  {info.num === 4 && done && solicitud.numero_resolucion_cpnna && (
                    <p className="text-xs text-green-600 mt-1">✓ Resolución {solicitud.numero_resolucion_cpnna}</p>
                  )}
                  {info.num === 5 && done && solicitud.entrega_completada_en && (
                    <p className="text-xs text-green-600 mt-1">✓ Entregado el {formatFecha(solicitud.entrega_completada_en)}</p>
                  )}

                  {/* Acciones del paso actual */}
                  {current && !isRejected && (
                    <div className="mt-3">
                      <PasoActions
                        solicitudId={solicitud.id}
                        ninoId={solicitud.nino_id}
                        paso={info.num}
                        canAdvancePaso4={canAdvancePaso4}
                        canAdvance={canAdvanceOthers}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Datos del reclamante */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Datos del reclamante</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Nombre completo', solicitud.reclamante_nombre],
            ['Cédula', solicitud.reclamante_cedula],
            ['Teléfono', solicitud.reclamante_telefono],
            ['Parentesco', PARENTESCO_LABELS[solicitud.reclamante_parentesco] || solicitud.reclamante_parentesco],
            ['Dirección', solicitud.reclamante_direccion || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-slate-400">{k}</p>
              <p className="text-sm text-slate-800 font-medium">{v}</p>
            </div>
          ))}
        </div>
        {solicitud.reclamante_parentesco_descripcion && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400">Descripción del parentesco</p>
            <p className="text-sm text-slate-700">{solicitud.reclamante_parentesco_descripcion}</p>
          </div>
        )}
      </div>
    </div>
  )
}
