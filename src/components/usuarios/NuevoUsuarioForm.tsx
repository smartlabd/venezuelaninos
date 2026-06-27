'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROL_LABELS } from '@/lib/utils/roles'

interface Props { refugios: { id: string; nombre: string }[] }

export default function NuevoUsuarioForm({ refugios }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    nombre_completo: '', cedula: '', telefono: '',
    email: '', password: '',
    rol: 'operador_refugio', refugio_id: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre_completo || !form.email || !form.password || !form.rol) {
      setError('Nombre, email, contraseña y rol son obligatorios.')
      return
    }
    if (form.rol === 'operador_refugio' && !form.refugio_id) {
      setError('Los operadores de refugio deben tener un refugio asignado.')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/usuarios/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al crear el usuario.')
      setLoading(false)
      return
    }
    setSuccess(`Usuario "${form.nombre_completo}" creado correctamente.`)
    setTimeout(() => router.push('/usuarios'), 1500)
  }

  const I = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
  )
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>{children}</div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Datos personales</h2>
        <F label="Nombre completo *"><I value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)} placeholder="Nombre y apellido" required /></F>
        <div className="grid grid-cols-2 gap-4">
          <F label="Cédula"><I value={form.cedula} onChange={e => set('cedula', e.target.value)} placeholder="V-00000000" /></F>
          <F label="Teléfono"><I value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="0414-000-0000" /></F>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Acceso al sistema</h2>
        <F label="Correo electrónico *"><I type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="usuario@reunifamilia.ve" required /></F>
        <F label="Contraseña temporal *"><I type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required /></F>
        <F label="Rol *">
          <select value={form.rol} onChange={e => set('rol', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
            {Object.entries(ROL_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </F>
        {form.rol === 'operador_refugio' && (
          <F label="Refugio asignado *">
            <select value={form.refugio_id} onChange={e => set('refugio_id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" required>
              <option value="">— Seleccionar refugio —</option>
              {refugios.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </F>
        )}
      </div>

      {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-xl border border-red-200">{error}</p>}
      {success && <p className="text-sm text-green-700 p-3 bg-green-50 rounded-xl border border-green-200">{success}</p>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
          {loading ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}
