import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Phone, User, CheckCircle, XCircle } from 'lucide-react'

export default async function RefugiosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  const { data: refugios } = await supabase.from('refugios').select('*').eq('activo', true).order('nombre')

  // Contar niños por refugio
  const refugiosConNinos = await Promise.all(
    (refugios || []).map(async (r) => {
      const { count } = await supabase.from('ninos').select('*', { count: 'exact', head: true }).eq('refugio_id', r.id).neq('estado', 'reunificado')
      return { ...r, total_ninos: count || 0 }
    })
  )

  const canCreate = ['coordinador_regional', 'administrador'].includes(usuario?.rol || '')

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{refugios?.length || 0} refugios activos</p>
        {canCreate && (
          <Link href="/refugios/nuevo" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nuevo refugio
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {refugiosConNinos.map((r) => {
          const pct = Math.round((r.total_ninos / r.capacidad_maxima) * 100)
          const capColor = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-green-600'
          const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'

          return (
            <Link key={r.id} href={`/refugios/${r.id}`} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{r.nombre}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{r.municipio}, {r.estado_venezuela}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.direccion}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-semibold ${capColor}`}>{r.total_ninos}</p>
                  <p className="text-xs text-slate-400">de {r.capacidad_maxima} lugares</p>
                </div>
              </div>

              {/* Barra capacidad */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {r.coordinador_nombre}
                </div>
                {r.telefono_principal && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {r.telefono_principal}
                  </div>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <span className={`flex items-center gap-1 text-xs ${r.tiene_medico ? 'text-green-600' : 'text-slate-400'}`}>
                    {r.tiene_medico ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Médico
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${r.tiene_psicologo ? 'text-green-600' : 'text-slate-400'}`}>
                    {r.tiene_psicologo ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Psicólogo
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${r.tiene_agua_potable ? 'text-green-600' : 'text-slate-400'}`}>
                    {r.tiene_agua_potable ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Agua
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${r.tiene_alimentacion ? 'text-green-600' : 'text-slate-400'}`}>
                    {r.tiene_alimentacion ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Alimentación
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
