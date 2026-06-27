import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, CheckCircle, XCircle } from 'lucide-react'
import { URGENCIA_COLORS, URGENCIA_LABELS, ESTADO_NINO_COLORS, ESTADO_NINO_LABELS } from '@/lib/utils/roles'
import { getNombreCompleto, formatRelativo } from '@/lib/utils/format'

export default async function RefugioPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  const [{ data: refugio }, { data: ninos }] = await Promise.all([
    supabase.from('refugios').select('*').eq('id', params.id).single(),
    supabase.from('ninos').select('id, nombre, apellido, nombre_no_identificado, codigo_emergencia, urgencia_medica, estado, foto_url, edad_aproximada').eq('refugio_id', params.id).neq('estado', 'reunificado').order('urgencia_medica'),
  ])

  if (!refugio) notFound()

  const pct = Math.round(((ninos?.length || 0) / refugio.capacidad_maxima) * 100)
  const canEdit = ['coordinador_regional', 'administrador'].includes(usuario?.rol || '')

  const servicios = [
    ['Médico disponible', refugio.tiene_medico],
    ['Psicólogo disponible', refugio.tiene_psicologo],
    ['Agua potable', refugio.tiene_agua_potable],
    ['Alimentación', refugio.tiene_alimentacion],
    ['Electricidad', refugio.tiene_electricidad],
    ['Acceso vehicular', refugio.tiene_acceso_vehicular],
  ]

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start gap-3">
        <Link href="/refugios" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900">{refugio.nombre}</h1>
          <p className="text-sm text-slate-500">{refugio.municipio}, {refugio.estado_venezuela} · {refugio.direccion}</p>
        </div>
        {canEdit && (
          <Link href={`/refugios/${refugio.id}/editar`} className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            <Edit className="w-4 h-4" />Editar
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Capacidad */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Capacidad actual</h2>
              <span className={`text-2xl font-bold ${pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-green-600'}`}>
                {ninos?.length || 0}/{refugio.capacidad_maxima}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{pct}% de capacidad utilizada</p>
          </div>

          {/* Niños en este refugio */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Niños en este refugio ({ninos?.length || 0})</h2>
            {ninos && ninos.length > 0 ? (
              <div className="space-y-2">
                {ninos.map((n: any) => (
                  <Link key={n.id} href={`/ninos/${n.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {n.foto_url ? <img src={n.foto_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-medium text-slate-500">{getNombreCompleto(n)[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{getNombreCompleto(n)}</p>
                      <p className="text-xs text-slate-400">{n.codigo_emergencia}{n.edad_aproximada ? ` · ${n.edad_aproximada} años` : ''}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${URGENCIA_COLORS[n.urgencia_medica]}`}>{URGENCIA_LABELS[n.urgencia_medica]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_NINO_COLORS[n.estado]}`}>{ESTADO_NINO_LABELS[n.estado]}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Sin niños activos en este refugio</p>
            )}
          </div>
        </div>

        {/* Info lateral */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Responsable</h2>
            <p className="text-sm font-medium text-slate-900">{refugio.coordinador_nombre}</p>
            {refugio.coordinador_cedula && <p className="text-xs text-slate-500 mt-0.5">C.I. {refugio.coordinador_cedula}</p>}
            {refugio.telefono_principal && <p className="text-xs text-slate-600 mt-2">📞 {refugio.telefono_principal}</p>}
            {refugio.telefono_secundario && <p className="text-xs text-slate-600 mt-0.5">📞 {refugio.telefono_secundario}</p>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Servicios disponibles</h2>
            <div className="space-y-2">
              {servicios.map(([label, ok]) => (
                <div key={label as string} className="flex items-center gap-2">
                  {ok
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  }
                  <span className={`text-xs ${ok ? 'text-slate-700' : 'text-slate-400'}`}>{label as string}</span>
                </div>
              ))}
            </div>
          </div>

          {refugio.notas_operativas && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Notas operativas</h2>
              <p className="text-xs text-slate-600">{refugio.notas_operativas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
