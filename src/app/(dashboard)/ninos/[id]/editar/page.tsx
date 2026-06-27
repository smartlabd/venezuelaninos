import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditarNinoForm from '@/components/ninos/EditarNinoForm'

export default async function EditarNinoPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol, refugio_id').eq('id', user!.id).single()

  if (!['operador_refugio', 'coordinador_regional', 'administrador'].includes(usuario?.rol || '')) {
    redirect(`/ninos/${params.id}`)
  }

  const [{ data: nino }, { data: refugios }] = await Promise.all([
    supabase.from('ninos').select('*').eq('id', params.id).single(),
    supabase.from('refugios').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  if (!nino) notFound()

  return (
    <div className="max-w-3xl">
      <EditarNinoForm nino={nino} refugios={refugios || []} usuarioRol={usuario?.rol || ''} />
    </div>
  )
}
