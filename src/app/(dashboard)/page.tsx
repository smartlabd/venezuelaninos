import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users, UserX, RefreshCw, CheckCircle, AlertTriangle, Building2 } from 'lucide-react'
import Link from 'next/link'
import { formatRelativo } from '@/lib/utils/format'
import { ESTADO_NINO_COLORS, ESTADO_NINO_LABELS, URGENCIA_COLORS, URGENCIA_LABELS } from '@/lib/utils/roles'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: totalNinos },
    { count: sinContacto },
    { count: enProceso },
    { count: reunificados },
    { count: criticos },
    { count: totalRefugios },
    { data: recentLog },
    { data: ninosCriticos },
    { data: refugiosData },
  ] = await Promise.all([
    supabase.from('ninos').select('*', { count: 'exact', head: true }),
    supabase.from('ninos').select('*', { count: 'exact', head: true }).in('estado', ['registrado', 'en_busqueda']),
    supabase.from('ninos').select('*', { count: 'exact', head: true }).in('estado', ['reclamado', 'en_proceso_legal']),
    supabase.from('ninos').select('*', { count: 'exact', head: true }).eq('estado', 'reunificado'),
    supabase.from('ninos').select('*', { count: 'exact', head: true }).eq('urgencia_medica', 'critico'),
    supabase.from('refugios').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('ninos').select('id, codigo_emergencia, nombre, apellido, nombre_no_identificado, urgencia_medica, condicion_medica, refugio:refugios(nombre)').eq('urgencia_medica', 'critico').neq('estado', 'reunificado').limit(5),
    supabase.from('refugios').select('id, nombre, capacidad_maxima').eq('activo', true).limit(6),
  ])

  // Contar niños por refugio
  const refugiosConNinos = await Promise.all(
    (refugiosData || []).map(async (r) => {
      const { count } = await supabase.from('ninos').select('*', { count: 'exact', head: true }).eq('refugio_id', r.id).neq('estado', 'reunificado')
      return { ...r, total_ninos: count || 0 }
    })
  )

  const stats = [
    { label: 'Niños registrados', value: totalNinos || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Sin contacto familiar', value: sinContacto || 0, icon: UserX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'En proceso reunificación', value: enProceso || 0, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Reunificados', value: reunificados || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  ]

  const accionLabels: Record<string, string> = {
    registro_nino: 'Niño registrado',
    cambio_estado_nino: 'Cambio de estado',
    nueva_solicitud_reunificacion: 'Nueva solicitud',
    avance_paso_reunificacion: 'Avance en proceso',
    transferencia_refugio: 'Transferencia de refugio',
  }

  return (
    <div className="space-y-6">
      {/* Alertas críticas */}
      {(criticos || 0) > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {criticos} niño{(criticos || 0) > 1 ? 's' : ''} en estado médico crítico
            </p>
            <p className="text-xs text-red-600 mt-0.5">Requieren atención médica inmediata</p>
          </div>
          <Link href="/ninos?urgencia=critico" className="ml-auto text-xs text-red-700 underline whitespace-nowrap">
            Ver ahora
          </Link>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`bg-white rounded-xl border p-5 ${s.border}`}>
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacidad refugios */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Capacidad refugios
            </h2>
            <Link href="/refugios" className="text-xs text-blue-600 hover:underline">{totalRefugios} activos</Link>
          </div>
          <div className="space-y-3">
            {refugiosConNinos.map((r) => {
              const pct = Math.round((r.total_ninos / r.capacidad_maxima) * 100)
              const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
              return (
                <div key={r.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium truncate max-w-[160px]">{r.nombre}</span>
                    <span className="text-slate-500 flex-shrink-0">{r.total_ninos}/{r.capacidad_maxima} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Actividad reciente</h2>
          <div className="space-y-3">
            {(recentLog || []).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  entry.accion.includes('registro') ? 'bg-blue-500' :
                  entry.accion.includes('entrega') || entry.accion === 'avance_paso_reunificacion' ? 'bg-green-500' :
                  entry.accion.includes('solicitud') ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800">{accionLabels[entry.accion] || entry.accion}</p>
                  <p className="text-xs text-slate-400">{formatRelativo(entry.created_at)}</p>
                </div>
              </div>
            ))}
            {(!recentLog || recentLog.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-4">Sin actividad reciente</p>
            )}
          </div>
        </div>
      </div>

      {/* Niños críticos */}
      {ninosCriticos && ninosCriticos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Casos urgentes
          </h2>
          <div className="space-y-2">
            {ninosCriticos.map((n: any) => (
              <Link
                key={n.id}
                href={`/ninos/${n.id}`}
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg hover:border-red-300 transition-colors"
              >
                <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-red-800">
                    {(n.nombre || n.nombre_no_identificado || 'S')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800">
                    {n.nombre ? `${n.nombre} ${n.apellido || ''}`.trim() : n.nombre_no_identificado}
                  </p>
                  <p className="text-xs text-slate-500">{n.codigo_emergencia} · {(n.refugio as any)?.nombre}</p>
                </div>
                <span className="text-xs font-medium text-red-700 flex-shrink-0">Crítico</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
