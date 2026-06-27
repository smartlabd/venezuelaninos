'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import type { Nino } from '@/lib/types/database'

interface Props { nino: Nino; refugios: { id: string; nombre: string }[]; usuarioRol: string }

export default function EditarNinoForm({ nino, refugios, usuarioRol }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: nino.nombre || '',
    apellido: nino.apellido || '',
    edad_aproximada: nino.edad_aproximada?.toString() || '',
    genero: nino.genero,
    descripcion_fisica: nino.descripcion_fisica,
    color_cabello: nino.color_cabello || '',
    color_ojos: nino.color_ojos || '',
    altura_aproximada_cm: nino.altura_aproximada_cm?.toString() || '',
    tiene_cicatrices: nino.tiene_cicatrices,
    descripcion_cicatrices: nino.descripcion_cicatrices || '',
    ropa_al_ingreso: nino.ropa_al_ingreso || '',
    refugio_id: nino.refugio_id,
    urgencia_medica: nino.urgencia_medica,
    condicion_medica: nino.condicion_medica || '',
    alergias_conocidas: nino.alergias_conocidas || '',
    medicamentos_requeridos: nino.medicamentos_requeridos || '',
    estado_psicoemocional: nino.estado_psicoemocional,
    notas_medicas: nino.notas_medicas || '',
    atendido_por_medico: nino.atendido_por_medico,
    atendido_por_psicologo: nino.atendido_por_psicologo,
    nombre_padre: nino.nombre_padre || '',
    nombre_madre: nino.nombre_madre || '',
    nombre_tutor_legal: nino.nombre_tutor_legal || '',
    telefono_familiar_recordado: nino.telefono_familiar_recordado || '',
    direccion_recordada: nino.direccion_recordada || '',
    barrio_recordado: nino.barrio_recordado || '',
    escuela_recordada: nino.escuela_recordada || '',
    otros_familiares_mencionados: nino.otros_familiares_mencionados || '',
    estado: nino.estado,
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descripcion_fisica.trim()) { setError('La descripción física es obligatoria.'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('ninos').update({
      nombre: form.nombre || null, apellido: form.apellido || null,
      edad_aproximada: form.edad_aproximada ? parseInt(form.edad_aproximada) : null,
      genero: form.genero, descripcion_fisica: form.descripcion_fisica,
      color_cabello: form.color_cabello || null, color_ojos: form.color_ojos || null,
      altura_aproximada_cm: form.altura_aproximada_cm ? parseInt(form.altura_aproximada_cm) : null,
      tiene_cicatrices: form.tiene_cicatrices,
      descripcion_cicatrices: form.descripcion_cicatrices || null,
      ropa_al_ingreso: form.ropa_al_ingreso || null,
      refugio_id: form.refugio_id,
      urgencia_medica: form.urgencia_medica,
      condicion_medica: form.condicion_medica || null,
      alergias_conocidas: form.alergias_conocidas || null,
      medicamentos_requeridos: form.medicamentos_requeridos || null,
      estado_psicoemocional: form.estado_psicoemocional,
      notas_medicas: form.notas_medicas || null,
      atendido_por_medico: form.atendido_por_medico,
      atendido_por_psicologo: form.atendido_por_psicologo,
      nombre_padre: form.nombre_padre || null, nombre_madre: form.nombre_madre || null,
      nombre_tutor_legal: form.nombre_tutor_legal || null,
      telefono_familiar_recordado: form.telefono_familiar_recordado || null,
      direccion_recordada: form.direccion_recordada || null,
      barrio_recordado: form.barrio_recordado || null,
      escuela_recordada: form.escuela_recordada || null,
      otros_familiares_mencionados: form.otros_familiares_mencionados || null,
      estado: form.estado,
      ultima_actualizacion_por: user!.id,
    }).eq('id', nino.id)

    if (err) { setError(err.message); setLoading(false); return }

    await supabase.from('audit_log').insert({
      accion: 'edicion_nino',
      entidad_tipo: 'nino', entidad_id: nino.id,
      usuario_id: user!.id,
      detalles: { codigo: nino.codigo_emergencia },
    })

    router.push(`/ninos/${nino.id}`)
  }

  const I = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
  )
  const T = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
  )
  const S = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">{children}</select>
  )
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>{children}</div>
  )
  const G2 = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-2 gap-4">{children}</div>

  const canChangeRefugio = ['coordinador_regional', 'administrador'].includes(usuarioRol)
  const canChangeEstado = ['coordinador_regional', 'administrador'].includes(usuarioRol)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-base font-semibold text-slate-900">Editar expediente</h1>
          <p className="text-sm text-slate-500">{nino.codigo_emergencia}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Datos básicos</h2>
        <G2>
          <F label="Nombre"><I value={form.nombre} onChange={e => set('nombre', e.target.value)} /></F>
          <F label="Apellido"><I value={form.apellido} onChange={e => set('apellido', e.target.value)} /></F>
          <F label="Edad aprox."><I type="number" value={form.edad_aproximada} onChange={e => set('edad_aproximada', e.target.value)} /></F>
          <F label="Género"><S value={form.genero} onChange={e => set('genero', e.target.value)}><option value="no_determinado">No determinado</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option></S></F>
        </G2>
        <F label="Descripción física *"><T rows={3} value={form.descripcion_fisica} onChange={e => set('descripcion_fisica', e.target.value)} required /></F>
        <G2>
          <F label="Color cabello"><I value={form.color_cabello} onChange={e => set('color_cabello', e.target.value)} /></F>
          <F label="Color ojos"><I value={form.color_ojos} onChange={e => set('color_ojos', e.target.value)} /></F>
          <F label="Altura (cm)"><I type="number" value={form.altura_aproximada_cm} onChange={e => set('altura_aproximada_cm', e.target.value)} /></F>
          <F label="Ropa al ingreso"><I value={form.ropa_al_ingreso} onChange={e => set('ropa_al_ingreso', e.target.value)} /></F>
        </G2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Estado y refugio</h2>
        <G2>
          <F label="Urgencia médica">
            <S value={form.urgencia_medica} onChange={e => set('urgencia_medica', e.target.value)}>
              <option value="estable">Estable</option><option value="moderado">Moderado</option><option value="critico">Crítico</option>
            </S>
          </F>
          <F label="Estado psicoemocional">
            <S value={form.estado_psicoemocional} onChange={e => set('estado_psicoemocional', e.target.value)}>
              <option value="en_evaluacion">En evaluación</option>
              <option value="estable_cooperativo">Estable, cooperativo</option>
              <option value="angustiado">Angustiado</option>
              <option value="en_shock">En shock</option>
              <option value="disociado">Disociado</option>
            </S>
          </F>
        </G2>
        {canChangeEstado && (
          <F label="Estado del menor">
            <S value={form.estado} onChange={e => set('estado', e.target.value)}>
              <option value="registrado">Registrado</option>
              <option value="en_busqueda">En búsqueda</option>
              <option value="reclamado">Reclamado</option>
              <option value="en_proceso_legal">Proceso legal</option>
              <option value="reunificado">Reunificado</option>
              <option value="custodia_institucional">Custodia institucional</option>
            </S>
          </F>
        )}
        {canChangeRefugio && (
          <F label="Refugio">
            <S value={form.refugio_id} onChange={e => set('refugio_id', e.target.value)}>
              {refugios.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </S>
          </F>
        )}
        <F label="Notas médicas"><T rows={2} value={form.notas_medicas} onChange={e => set('notas_medicas', e.target.value)} /></F>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.atendido_por_medico} onChange={e => set('atendido_por_medico', e.target.checked)} className="w-4 h-4 rounded text-red-600" />
            Atendido por médico
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.atendido_por_psicologo} onChange={e => set('atendido_por_psicologo', e.target.checked)} className="w-4 h-4 rounded text-red-600" />
            Atendido por psicólogo
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Información familiar</h2>
        <G2>
          <F label="Padre"><I value={form.nombre_padre} onChange={e => set('nombre_padre', e.target.value)} /></F>
          <F label="Madre"><I value={form.nombre_madre} onChange={e => set('nombre_madre', e.target.value)} /></F>
          <F label="Teléfono recordado"><I value={form.telefono_familiar_recordado} onChange={e => set('telefono_familiar_recordado', e.target.value)} /></F>
          <F label="Barrio"><I value={form.barrio_recordado} onChange={e => set('barrio_recordado', e.target.value)} /></F>
          <F label="Escuela"><I value={form.escuela_recordada} onChange={e => set('escuela_recordada', e.target.value)} /></F>
        </G2>
        <F label="Dirección recordada"><I value={form.direccion_recordada} onChange={e => set('direccion_recordada', e.target.value)} /></F>
        <F label="Otros familiares"><T rows={2} value={form.otros_familiares_mencionados} onChange={e => set('otros_familiares_mencionados', e.target.value)} /></F>
      </div>

      {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-xl border border-red-200">{error}</p>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
