import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatFecha } from '@/lib/utils/format'

const ACCION_COLORS: Record<string, string> = {
  registro_nino: 'bg-blue-100 text-blue-700',
  cambio_estado_nino: 'bg-purple-100 text-purple-700',
  entrega_completada: 'bg-green-100 text-green-700',
  nueva_solicitud_reunificacion: 'bg-amber-100 text-amber-700',
  solicitud_rechazada: 'bg-red-100 text-red-700',
  avance_paso_reunificacion: 'bg-slate-100 text-slate-700',
  transferencia_refugio: 'bg-orange-100 text-orange-700',
}

export default async function AuditPage({ searchParams }: { searchParams: { tipo?: string; page?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  if (!['administrador', 'coordinador_regional', 'autoridad_legal'].includes(usuario?.rol || '')) {
    redirect('/')
  }

  const page = parseInt(searchParams.page || '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('audit_log').select('*, usuario:usuarios!usuario_id(nombre_completo)', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to)
  if (searchParams.tipo) query = query.eq('accion', searchParams.tipo)

  const { data: entries, count } = await query
  const totalPages = Math.ceil((count || 0) / pageSize)

  const acciones = [
    'registro_nino', 'cambio_estado_nino', 'entrega_completada',
    'nueva_solicitud_reunificacion', 'solicitud_rechazada',
    'avance_paso_reunificacion', 'transferencia_refugio',
  ]

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        <a href="/audit" className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!searchParams.tipo ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
          Todas
        </a>
        {acciones.map(a => (
          <a key={a} href={`/audit?tipo=${a}`} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${searchParams.tipo === a ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
            {a.replace(/_/g, ' ')}
          </a>
        ))}
      </div>

      <p className="text-xs text-slate-500">{count} registros totales</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Fecha/Hora</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Acción</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Entidad</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(entries || []).map((entry: any) => (
              <tr key={entry.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatFecha(entry.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACCION_COLORS[entry.accion] || 'bg-slate-100 text-slate-700'}`}>
                    {entry.accion.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{entry.entidad_tipo}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{entry.usuario?.nombre_completo || entry.usuario_nombre || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                  {Object.entries(entry.detalles || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {page > 1 && <a href={`/audit?page=${page - 1}${searchParams.tipo ? `&tipo=${searchParams.tipo}` : ''}`} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">← Anterior</a>}
          <span className="px-3 py-1.5 text-sm text-slate-500">Página {page} de {totalPages}</span>
          {page < totalPages && <a href={`/audit?page=${page + 1}${searchParams.tipo ? `&tipo=${searchParams.tipo}` : ''}`} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Siguiente →</a>}
        </div>
      )}
    </div>
  )
}
