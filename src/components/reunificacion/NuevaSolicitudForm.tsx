'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'
import { getNombreCompleto } from '@/lib/utils/format'

interface Nino { id: string; nombre?: string; apellido?: string; nombre_no_identificado: string; codigo_emergencia: string; refugio?: any }
interface Props { ninos: Nino[]; preselectedNinoId?: string }

export default function NuevaSolicitudForm({ ninos, preselectedNinoId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nino_id: preselectedNinoId || '',
    reclamante_nombre: '',
    reclamante_cedula: '',
    reclamante_telefono: '',
    reclamante_parentesco: 'padre',
    reclamante_parentesco_descripcion: '',
    reclamante_direccion: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nino_id || !form.reclamante_nombre || !form.reclamante_cedula || !form.reclamante_telefono) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error: insertErr } = await supabase
        .from('solicitudes_reunificacion')
        .insert({
          nino_id: form.nino_id,
          reclamante_nombre: form.reclamante_nombre,
          reclamante_cedula: form.reclamante_cedula,
          reclamante_telefono: form.reclamante_telefono,
          reclamante_parentesco: form.reclamante_parentesco,
          reclamante_parentesco_descripcion: form.reclamante_parentesco_descripcion || null,
          reclamante_direccion: form.reclamante_direccion || null,
          recibida_por: user!.id,
          paso_actual: 1,
          estado: 'paso_1_solicitud',
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // Actualizar estado del niño a "reclamado"
      await supabase.from('ninos').update({ estado: 'reclamado', ultima_actualizacion_por: user!.id }).eq('id', form.nino_id)

      router.push(`/reunificacion/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al registrar la solicitud.')
      setLoading(false)
    }
  }

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
  )

  const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
      {children}
    </select>
  )

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">
          Al registrar esta solicitud el niño pasa a estado "Reclamado". Se inicia el proceso de 5 pasos. Ninguna entrega puede realizarse sin completar todos los pasos.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Niño a reunificar</h2>
        <Field label="Seleccionar niño" required>
          <Select value={form.nino_id} onChange={e => set('nino_id', e.target.value)} required disabled={!!preselectedNinoId}>
            <option value="">— Seleccionar —</option>
            {ninos.map(n => (
              <option key={n.id} value={n.id}>
                {getNombreCompleto(n)} · {n.codigo_emergencia} · {n.refugio?.nombre}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Datos del reclamante</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre completo" required>
            <Input value={form.reclamante_nombre} onChange={e => set('reclamante_nombre', e.target.value)} placeholder="Nombre completo" required />
          </Field>
          <Field label="Número de cédula" required>
            <Input value={form.reclamante_cedula} onChange={e => set('reclamante_cedula', e.target.value)} placeholder="V-00000000" required />
          </Field>
          <Field label="Teléfono de contacto" required>
            <Input value={form.reclamante_telefono} onChange={e => set('reclamante_telefono', e.target.value)} placeholder="0414-000-0000" required />
          </Field>
          <Field label="Parentesco con el niño" required>
            <Select value={form.reclamante_parentesco} onChange={e => set('reclamante_parentesco', e.target.value)}>
              <option value="padre">Padre</option>
              <option value="madre">Madre</option>
              <option value="abuelo_a">Abuelo/a</option>
              <option value="tio_a">Tío/a</option>
              <option value="hermano_a">Hermano/a</option>
              <option value="tutor_legal">Tutor legal</option>
              <option value="otro_familiar">Otro familiar</option>
              <option value="vecino_conocido">Vecino conocido</option>
            </Select>
          </Field>
        </div>
        {['otro_familiar', 'vecino_conocido'].includes(form.reclamante_parentesco) && (
          <Field label="Descripción del vínculo">
            <Input value={form.reclamante_parentesco_descripcion} onChange={e => set('reclamante_parentesco_descripcion', e.target.value)} placeholder="Describe cómo conoce al niño..." />
          </Field>
        )}
        <Field label="Dirección del reclamante">
          <Input value={form.reclamante_direccion} onChange={e => set('reclamante_direccion', e.target.value)} placeholder="Calle, urbanización, municipio..." />
        </Field>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-700">{error}</p></div>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
          {loading ? 'Registrando...' : 'Registrar solicitud e iniciar proceso'}
        </button>
      </div>
    </form>
  )
}
