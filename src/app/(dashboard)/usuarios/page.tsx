import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { ROL_LABELS, ROL_COLORS } from '@/lib/utils/roles'
import { formatFechaCorta } from '@/lib/utils/format'

export default async function UsuariosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  if (me?.rol !== 'administrador') redirect('/')

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*, refugio:refugios(nombre)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{usuarios?.length || 0} usuarios registrados</p>
        <Link href="/usuarios/nuevo" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Refugio asignado</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Registro</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(usuarios || []).map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 text-sm">{u.nombre_completo}</p>
                  {u.cedula && <p className="text-xs text-slate-400">C.I. {u.cedula}</p>}
                  {u.telefono && <p className="text-xs text-slate-400">{u.telefono}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${ROL_COLORS[u.rol as keyof typeof ROL_COLORS]}`}>
                    {ROL_LABELS[u.rol as keyof typeof ROL_LABELS]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {u.refugio?.nombre || <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatFechaCorta(u.created_at)}
                </td>
                <td className="px-4 py-3">
                  {u.activo
                    ? <span className="flex items-center gap-1 text-xs text-green-700"><UserCheck className="w-3.5 h-3.5" />Activo</span>
                    : <span className="flex items-center gap-1 text-xs text-red-600"><UserX className="w-3.5 h-3.5" />Inactivo</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
