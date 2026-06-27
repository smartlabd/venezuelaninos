import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevoRefugioForm from '@/components/refugios/NuevoRefugioForm'

export default async function NuevoRefugioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  if (!['coordinador_regional', 'administrador'].includes(usuario?.rol || '')) redirect('/refugios')

  return (
    <div className="max-w-2xl">
      <NuevoRefugioForm />
    </div>
  )
}
