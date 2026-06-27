'use client'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Rol } from '@/lib/types/database'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/ninos': 'Niños registrados',
  '/ninos/nuevo': 'Registrar niño',
  '/reunificacion': 'Procesos de reunificación',
  '/reunificacion/nueva': 'Nueva solicitud',
  '/refugios': 'Refugios',
  '/refugios/nuevo': 'Nuevo refugio',
  '/audit': 'Audit Log',
  '/usuarios': 'Gestión de usuarios',
  '/usuarios/nuevo': 'Nuevo usuario',
}

interface HeaderProps {
  usuario: { nombre_completo: string; rol: Rol }
}

export default function Header({ usuario }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const title = PAGE_TITLES[pathname] || 'ReuniFamilia'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </header>
  )
}
