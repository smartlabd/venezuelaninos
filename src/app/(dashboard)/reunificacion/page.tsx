import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatRelativo, getNombreCompleto } from '@/lib/utils/format'
import { PARENTESCO_LABELS } from '@/lib/utils/roles'

const PASO_COLORS: Record<string, string> = {
  paso_1_solicitud: 'bg-slate-100 text-slate-700',
  paso_2_identidad_verificada: 'bg-blue-100 text-blue-700',
  paso_3_vinculo_documentado: 'bg-purple-100 text-purple-700',
  paso_4_autoridad_aprobada: 'bg-amber-100 text-amber-700',
  paso_5_entrega_completada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  suspendida: 'bg-orange-100 text-orange-700',
}

const PASO_LABELS: Record<string, string> = {
  paso_1_solicitud: 'Paso 1 — Solicitud',
  paso_2_identidad_verificada: 'Paso 2 — Identidad',
  paso_3_vinculo_documentado: 'Paso 3 — Vínculo',
  paso_4_autoridad_aprobada: 'Paso 4 — Autorización',
  paso_5_entrega_completada: 'Completado ✓',
  rechazada: 'Rechazada',
  suspendida: 'Suspendida',
}

export default async function ReunificacionPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol, refugio_id').eq('id', user!.id).single()

  let query = supabase
    .from('solicitudes_reunificacion')
    .select('*, nino:ninos(id, nombre, apellido, nombre_no_identificado, codigo_emergencia, refugio_id, foto_url)')
    .order('created_at', { ascending: false })

  if (usuario?.rol === 'operador_refugio' && usuario.refugio_id) {
    query = query.in('nino_id', supabase.from('ninos').select('id').eq('refugio_id', usuario.refugio_id) as any)
  }

  const { data: solicitudes } = await query

  const activas = (solicitudes || []).filter(s => !['paso_5_entrega_completada', 'rechazada'].includes(s.estado))
  const completadas = (solicitudes || []).filter(s => s.estado === 'paso_5_entrega_completada')
  const rechazadas = (solicitudes || []).filter(s => s.estado === 'rechazada')

  const canCreate = ['operador_refugio', 'coordinador_regional', 'administrador'].includes(usuario?.rol || '')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="text-slate-600"><strong className="text-amber-600">{activas.length}</strong> en proceso</span>
          <span className="text-slate-600"><strong className="text-green-600">{completadas.length}</strong> completadas</span>
          <span className="text-slate-600"><strong className="text-red-600">{rechazadas.length}</strong> rechazadas</span>
        </div>
        {canCreate && (
          <Link href="/reunificacion/nueva" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nueva solicitud
          </Link>
        )}
      </div>

      {activas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">En proceso</h2>
          <div className="space-y-2">
            {activas.map((s: any) => (
              <SolicitudCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}

      {completadas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Completadas</h2>
          <div className="space-y-2">
            {completadas.map((s: any) => (
              <SolicitudCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}

      {(!solicitudes || solicitudes.length === 0) && (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">Sin solicitudes de reunificación</p>
          {canCreate && (
            <Link href="/reunificacion/nueva" className="text-sm text-red-600 hover:underline mt-1 block">Crear primera solicitud</Link>
          )}
        </div>
      )}
    </div>
  )
}

function SolicitudCard({ s }: { s: any }) {
  const nino = s.nino
  const nombre = nino ? getNombreCompleto(nino) : '—'

  return (
    <Link
      href={`/reunificacion/${s.id}`}
      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {nino?.foto_url
          ? <img src={nino.foto_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-sm font-semibold text-slate-400">{nombre[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{nombre}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Reclamante: {s.reclamante_nombre} · {PARENTESCO_LABELS[s.reclamante_parentesco] || s.reclamante_parentesco}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{formatRelativo(s.created_at)}</p>
      </div>
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${PASO_COLORS[s.estado] || 'bg-slate-100 text-slate-700'}`}>
        {PASO_LABELS[s.estado] || s.estado}
      </span>
    </Link>
  )
}
