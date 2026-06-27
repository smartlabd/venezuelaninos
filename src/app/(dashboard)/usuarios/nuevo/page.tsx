import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevoUsuarioForm from '@/components/usuarios/NuevoUsuarioForm'

export default async function NuevoUsuarioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  if (me?.rol !== 'administrador') redirect('/')

  const { data: refugios } = await supabase.from('refugios').select('id, nombre').eq('activo', true).order('nombre')

  return (
    <div className="max-w-xl">
      <NuevoUsuarioForm refugios={refugios || []} />
    </div>
  )
}
