import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevaSolicitudForm from '@/components/reunificacion/NuevaSolicitudForm'

export default async function NuevaSolicitudPage({ searchParams }: { searchParams: { nino_id?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()

  if (!['operador_refugio', 'coordinador_regional', 'administrador'].includes(usuario?.rol || '')) {
    redirect('/reunificacion')
  }

  // Cargar niños sin reunificación activa
  let ninosQuery = supabase.from('ninos').select('id, nombre, apellido, nombre_no_identificado, codigo_emergencia, refugio:refugios(nombre)').neq('estado', 'reunificado').order('created_at', { ascending: false })
  if (searchParams.nino_id) ninosQuery = ninosQuery.eq('id', searchParams.nino_id)
  const { data: ninos } = await ninosQuery

  return (
    <div className="max-w-2xl">
      <NuevaSolicitudForm ninos={ninos || []} preselectedNinoId={searchParams.nino_id} />
    </div>
  )
}
