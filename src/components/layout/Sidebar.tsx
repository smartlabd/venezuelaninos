'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShieldHeart, LayoutDashboard, Users, Heart,
  Building2, ClipboardList, UserCog, ChevronRight
} from 'lucide-react'
import { ROL_LABELS, PERMISOS } from '@/lib/utils/roles'
import type { Rol } from '@/lib/types/database'

interface SidebarProps {
  usuario: {
    nombre_completo: string
    rol: Rol
    refugio?: { nombre: string } | null
  }
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['operador_refugio', 'coordinador_regional', 'autoridad_legal', 'administrador'] },
  { href: '/ninos', label: 'Niños', icon: Users, roles: ['operador_refugio', 'coordinador_regional', 'autoridad_legal', 'administrador'] },
  { href: '/reunificacion', label: 'Reunificación', icon: Heart, roles: ['operador_refugio', 'coordinador_regional', 'autoridad_legal', 'administrador'] },
  { href: '/refugios', label: 'Refugios', icon: Building2, roles: ['operador_refugio', 'coordinador_regional', 'autoridad_legal', 'administrador'] },
  { href: '/audit', label: 'Audit Log', icon: ClipboardList, roles: ['coordinador_regional', 'autoridad_legal', 'administrador'] },
  { href: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['administrador'] },
]

export default function Sidebar({ usuario }: SidebarProps) {
  const pathname = usePathname()
  const itemsVisibles = navItems.filter(item => item.roles.includes(usuario.rol))

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">ReuniFamilia</p>
            <p className="text-xs text-slate-400">Emergencia Venezuela</p>
          </div>
        </div>
      </div>

      {/* Alerta activa */}
      <div className="mx-4 mt-4 p-2.5 bg-red-900/50 border border-red-700 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <span className="text-xs text-red-300 font-medium">Emergencia activa</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {itemsVisibles.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                active
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium">
              {usuario.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{usuario.nombre_completo}</p>
            <p className="text-xs text-slate-400 truncate">{ROL_LABELS[usuario.rol]}</p>
            {usuario.refugio && (
              <p className="text-xs text-slate-500 truncate">{usuario.refugio.nombre}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
