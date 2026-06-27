'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevoRefugioForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '', direccion: '', municipio: '', estado_venezuela: 'Distrito Capital',
    capacidad_maxima: '20', telefono_principal: '', telefono_secundario: '',
    coordinador_nombre: '', coordinador_cedula: '',
    tiene_medico: false, tiene_psicologo: false,
    tiene_agua_potable: true, tiene_alimentacion: true,
    tiene_electricidad: true, tiene_acceso_vehicular: true,
    notas_operativas: '',
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.direccion || !form.coordinador_nombre) {
      setError('Nombre, dirección y coordinador son obligatorios.')
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase.from('refugios').insert({
      ...form,
      capacidad_maxima: parseInt(form.capacidad_maxima),
      telefono_principal: form.telefono_principal || null,
      telefono_secundario: form.telefono_secundario || null,
      coordinador_cedula: form.coordinador_cedula || null,
      notas_operativas: form.notas_operativas || null,
    }).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/refugios/${data.id}`)
  }

  const I = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
  )
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>{children}</div>
  )
  const CB = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 rounded text-red-600" />
      {label}
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Información del refugio</h2>
        <F label="Nombre del refugio *"><I value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Refugio El Paraíso" required /></F>
        <F label="Dirección completa *"><I value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle, sector, referencia" required /></F>
        <div className="grid grid-cols-2 gap-4">
          <F label="Municipio *"><I value={form.municipio} onChange={e => set('municipio', e.target.value)} placeholder="Ej. Libertador" required /></F>
          <F label="Estado">
            <select value={form.estado_venezuela} onChange={e => set('estado_venezuela', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
              {['Distrito Capital','Miranda','Aragua','Carabobo','Lara','Zulia','Bolívar','Anzoátegui','Táchira','Mérida','Falcón','Sucre','Monagas','Barinas','Guárico','Cojedes','Apure','Amazonas','Delta Amacuro','Nueva Esparta','Trujillo','Vargas','Yaracuy','Portuguesa'].map(e => <option key={e}>{e}</option>)}
            </select>
          </F>
          <F label="Capacidad máxima *"><I type="number" min="1" value={form.capacidad_maxima} onChange={e => set('capacidad_maxima', e.target.value)} required /></F>
          <F label="Teléfono principal"><I value={form.telefono_principal} onChange={e => set('telefono_principal', e.target.value)} placeholder="0212-000-0000" /></F>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Coordinador responsable</h2>
        <div className="grid grid-cols-2 gap-4">
          <F label="Nombre completo *"><I value={form.coordinador_nombre} onChange={e => set('coordinador_nombre', e.target.value)} placeholder="Nombre y apellido" required /></F>
          <F label="Cédula"><I value={form.coordinador_cedula} onChange={e => set('coordinador_cedula', e.target.value)} placeholder="V-00000000" /></F>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Servicios disponibles</h2>
        <div className="grid grid-cols-2 gap-3">
          <CB label="Médico disponible" checked={form.tiene_medico} onChange={v => set('tiene_medico', v)} />
          <CB label="Psicólogo disponible" checked={form.tiene_psicologo} onChange={v => set('tiene_psicologo', v)} />
          <CB label="Agua potable" checked={form.tiene_agua_potable} onChange={v => set('tiene_agua_potable', v)} />
          <CB label="Alimentación garantizada" checked={form.tiene_alimentacion} onChange={v => set('tiene_alimentacion', v)} />
          <CB label="Electricidad" checked={form.tiene_electricidad} onChange={v => set('tiene_electricidad', v)} />
          <CB label="Acceso vehicular" checked={form.tiene_acceso_vehicular} onChange={v => set('tiene_acceso_vehicular', v)} />
        </div>
        <F label="Notas operativas">
          <textarea value={form.notas_operativas} onChange={e => set('notas_operativas', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" rows={2} placeholder="Observaciones adicionales para operadores..." />
        </F>
      </div>

      {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-xl">{error}</p>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
          {loading ? 'Guardando...' : 'Crear refugio'}
        </button>
      </div>
    </form>
  )
}
