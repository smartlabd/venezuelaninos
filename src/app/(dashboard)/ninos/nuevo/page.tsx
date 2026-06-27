import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormRegistroNino from '@/components/ninos/FormRegistroNino'

export default async function NuevoNinoPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol, refugio_id').eq('id', user!.id).single()

  if (!['operador_refugio', 'coordinador_regional', 'administrador'].includes(usuario?.rol || '')) {
    redirect('/ninos')
  }

  const { data: refugios } = await supabase.from('refugios').select('id, nombre, municipio, estado_venezuela').eq('activo', true).order('nombre')

  return (
    <div className="max-w-3xl">
      <FormRegistroNino refugios={refugios || []} usuarioRefugioId={usuario?.refugio_id} />
    </div>
  )
}
