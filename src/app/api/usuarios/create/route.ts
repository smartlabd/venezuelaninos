import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Verify caller is admin
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: caller } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (caller?.rol !== 'administrador') return NextResponse.json({ error: 'Solo administradores pueden crear usuarios' }, { status: 403 })

    const body = await request.json()
    const { nombre_completo, cedula, telefono, email, password, rol, refugio_id } = body

    const admin = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Insert into usuarios table
    const { error: insertError } = await admin.from('usuarios').insert({
      id: authData.user.id,
      nombre_completo,
      cedula: cedula || null,
      telefono: telefono || null,
      rol,
      refugio_id: refugio_id || null,
    })

    if (insertError) {
      // Rollback auth user if DB insert fails
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Audit log
    await supabase.from('audit_log').insert({
      accion: 'creacion_usuario',
      entidad_tipo: 'usuario',
      entidad_id: authData.user.id,
      usuario_id: user.id,
      detalles: { nombre: nombre_completo, rol, email },
    })

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
