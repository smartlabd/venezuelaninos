import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { ESTADO_NINO_COLORS, ESTADO_NINO_LABELS, URGENCIA_COLORS, URGENCIA_LABELS } from '@/lib/utils/roles'
import { formatRelativo, getNombreCompleto, getIniciales } from '@/lib/utils/format'

interface SearchParams { estado?: string; urgencia?: string; q?: string; refugio?: string }

export default async function NinosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol, refugio_id').eq('id', user!.id).single()

  let query = supabase
    .from('ninos')
    .select('*, refugio:refugios(id, nombre)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (usuario?.rol === 'operador_refugio' && usuario.refugio_id) {
    query = query.eq('refugio_id', usuario.refugio_id)
  }
  if (searchParams.estado) query = query.eq('estado', searchParams.estado)
  if (searchParams.urgencia) query = query.eq('urgencia_medica', searchParams.urgencia)
  if (searchParams.refugio && usuario?.rol !== 'operador_refugio') query = query.eq('refugio_id', searchParams.refugio)

  const { data: ninos } = await query
  const { data: refugios } = await supabase.from('refugios').select('id, nombre').eq('activo', true)

  const filteredNinos = searchParams.q
    ? (ninos || []).filter(n =>
        getNombreCompleto(n).toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        n.codigo_emergencia.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        n.descripcion_fisica?.toLowerCase().includes(searchParams.q!.toLowerCase())
      )
    : (ninos || [])

  const canRegister = ['operador_refugio', 'coordinador_regional', 'administrador'].includes(usuario?.rol || '')

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Buscar por nombre, código, descripción física..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            name="estado"
            defaultValue={searchParams.estado}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="registrado">Registrado</option>
            <option value="en_busqueda">En búsqueda</option>
            <option value="reclamado">Reclamado</option>
            <option value="en_proceso_legal">Proceso legal</option>
            <option value="reunificado">Reunificado</option>
          </select>
          <select
            name="urgencia"
            defaultValue={searchParams.urgencia}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="">Toda urgencia</option>
            <option value="critico">Crítico</option>
            <option value="moderado">Moderado</option>
            <option value="estable">Estable</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors">
            Filtrar
          </button>
        </form>
        {canRegister && (
          <Link
            href="/ninos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Registrar niño
          </Link>
        )}
      </div>

      <p className="text-sm text-slate-500">{filteredNinos.length} niño{filteredNinos.length !== 1 ? 's' : ''} encontrado{filteredNinos.length !== 1 ? 's' : ''}</p>

      {/* Lista */}
      <div className="grid gap-3">
        {filteredNinos.map((nino) => (
          <Link
            key={nino.id}
            href={`/ninos/${nino.id}`}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all flex gap-4"
          >
            {/* Avatar / foto */}
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {nino.foto_url ? (
                <img src={nino.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-slate-400">
                  {getNombreCompleto(nino)[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{getNombreCompleto(nino)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{nino.codigo_emergencia} · {(nino.refugio as any)?.nombre}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCIA_COLORS[nino.urgencia_medica]}`}>
                    {URGENCIA_LABELS[nino.urgencia_medica]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_NINO_COLORS[nino.estado]}`}>
                    {ESTADO_NINO_LABELS[nino.estado]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                {nino.edad_aproximada && <span className="text-xs text-slate-500">{nino.edad_aproximada} años aprox.</span>}
                {nino.genero !== 'no_determinado' && <span className="text-xs text-slate-500 capitalize">{nino.genero}</span>}
                <span className="text-xs text-slate-400">{formatRelativo(nino.created_at)}</span>
              </div>
              {nino.descripcion_fisica && (
                <p className="text-xs text-slate-500 mt-1 truncate">{nino.descripcion_fisica}</p>
              )}
            </div>
          </Link>
        ))}

        {filteredNinos.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay niños registrados</p>
            <p className="text-sm mt-1">
              {canRegister
                ? <Link href="/ninos/nuevo" className="text-red-600 hover:underline">Registrar el primero</Link>
                : 'No hay registros que mostrar'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
