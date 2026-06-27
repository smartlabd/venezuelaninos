'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, User, Heart, Home, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface Refugio { id: string; nombre: string; municipio: string; estado_venezuela: string }
interface Props { refugios: Refugio[]; usuarioRefugioId?: string | null }

export default function FormRegistroNino({ refugios, usuarioRefugioId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState({ identidad: true, salud: true, familia: true, docs: false })

  const [form, setForm] = useState({
    nombre: '', apellido: '',
    edad_aproximada: '', genero: 'no_determinado',
    descripcion_fisica: '', color_cabello: '', color_ojos: '',
    altura_aproximada_cm: '', tiene_cicatrices: false,
    descripcion_cicatrices: '', ropa_al_ingreso: '',
    refugio_id: usuarioRefugioId || (refugios[0]?.id || ''),
    urgencia_medica: 'estable',
    condicion_medica: '', alergias_conocidas: '',
    medicamentos_requeridos: '',
    estado_psicoemocional: 'en_evaluacion',
    notas_medicas: '',
    atendido_por_medico: false, atendido_por_psicologo: false,
    nombre_padre: '', nombre_madre: '', nombre_tutor_legal: '',
    telefono_familiar_recordado: '', direccion_recordada: '',
    barrio_recordado: '', escuela_recordada: '',
    otros_familiares_mencionados: '',
    cedula_numero: '', partida_nacimiento_numero: '', pasaporte_numero: '',
    tiene_documentos_fisicos: false,
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleSection = (s: keyof typeof openSections) =>
    setOpenSections(o => ({ ...o, [s]: !o[s] }))

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descripcion_fisica.trim()) {
      setError('La descripción física es obligatoria para identificación.')
      return
    }
    if (!form.refugio_id) {
      setError('Debes seleccionar un refugio.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Generar código de emergencia
      const { data: codigoData } = await supabase.rpc('generar_codigo_emergencia')
      const codigo = codigoData

      // Subir foto si hay
      let foto_url = null
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop()
        const path = `${codigo}/${Date.now()}.${ext}`
        const { data: uploadData } = await supabase.storage
          .from('fotos-menores')
          .upload(path, fotoFile, { contentType: fotoFile.type })
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('fotos-menores').getPublicUrl(path)
          foto_url = urlData.publicUrl
        }
      }

      const payload = {
        codigo_emergencia: codigo,
        foto_url,
        nombre: form.nombre || null,
        apellido: form.apellido || null,
        edad_aproximada: form.edad_aproximada ? parseInt(form.edad_aproximada) : null,
        genero: form.genero,
        descripcion_fisica: form.descripcion_fisica,
        color_cabello: form.color_cabello || null,
        color_ojos: form.color_ojos || null,
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
        nombre_padre: form.nombre_padre || null,
        nombre_madre: form.nombre_madre || null,
        nombre_tutor_legal: form.nombre_tutor_legal || null,
        telefono_familiar_recordado: form.telefono_familiar_recordado || null,
        direccion_recordada: form.direccion_recordada || null,
        barrio_recordado: form.barrio_recordado || null,
        escuela_recordada: form.escuela_recordada || null,
        otros_familiares_mencionados: form.otros_familiares_mencionados || null,
        cedula_numero: form.cedula_numero || null,
        partida_nacimiento_numero: form.partida_nacimiento_numero || null,
        pasaporte_numero: form.pasaporte_numero || null,
        tiene_documentos_fisicos: form.tiene_documentos_fisicos,
        registrado_por: user!.id,
      }

      const { data: nino, error: insertError } = await supabase
        .from('ninos')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw insertError

      // Audit log manual (el trigger también lo hace, esto es adicional)
      await supabase.from('audit_log').insert({
        accion: 'registro_nino_completo',
        entidad_tipo: 'nino',
        entidad_id: nino.id,
        usuario_id: user!.id,
        detalles: { codigo, refugio_id: form.refugio_id, urgencia: form.urgencia_medica },
      })

      router.push(`/ninos/${nino.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al registrar. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const Section = ({ id, icon: Icon, title, children }: { id: keyof typeof openSections; icon: any; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-red-600" />
        </div>
        <span className="font-medium text-sm text-slate-900 flex-1">{title}</span>
        {openSections[id] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {openSections[id] && <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  )

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )

  const Input = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${props.className || ''}`} />
  )

  const Textarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
  )

  const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
      {children}
    </select>
  )

  const Grid2 = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-2 gap-4">{children}</div>
  )

  const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Foto y datos básicos */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-red-600" />
          </div>
          <h2 className="font-medium text-sm text-slate-900">Identificación visual y registro</h2>
        </div>

        <div className="flex gap-4">
          {/* Foto */}
          <label className="flex-shrink-0 cursor-pointer">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 flex flex-col items-center justify-center bg-slate-50 overflow-hidden transition-colors">
              {fotoPreview ? (
                <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-slate-300 mb-1" />
                  <span className="text-xs text-slate-400 text-center">Foto del niño</span>
                </>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
          </label>

          <div className="flex-1 space-y-3">
            <Grid2>
              <Field label="Nombre">
                <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Si lo sabe..." />
              </Field>
              <Field label="Apellido">
                <Input value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Si lo sabe..." />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Refugio" required>
                <Select value={form.refugio_id} onChange={e => set('refugio_id', e.target.value)}>
                  {refugios.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Urgencia médica" required>
                <div className="flex gap-2">
                  {['critico', 'moderado', 'estable'].map(u => (
                    <button
                      key={u} type="button"
                      onClick={() => set('urgencia_medica', u)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        form.urgencia_medica === u
                          ? u === 'critico' ? 'bg-red-600 text-white border-red-600'
                            : u === 'moderado' ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {u === 'critico' ? '🔴' : u === 'moderado' ? '🟡' : '🟢'} {u.charAt(0).toUpperCase() + u.slice(1)}
                    </button>
                  ))}
                </div>
              </Field>
            </Grid2>
          </div>
        </div>
      </div>

      {/* Identidad */}
      <Section id="identidad" icon={User} title="Descripción física e identidad">
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">La descripción física es clave para la identificación cruzada entre refugios.</p>
        </div>
        <Field label="Descripción física detallada" required>
          <Textarea rows={3} value={form.descripcion_fisica} onChange={e => set('descripcion_fisica', e.target.value)} placeholder="Describe con detalle: estatura, complexión, rasgos faciales, señas particulares, cicatrices visibles, marcas de nacimiento..." required />
        </Field>
        <Grid2>
          <Field label="Edad aproximada">
            <Input type="number" min="0" max="17" value={form.edad_aproximada} onChange={e => set('edad_aproximada', e.target.value)} placeholder="Ej. 7" />
          </Field>
          <Field label="Género">
            <Select value={form.genero} onChange={e => set('genero', e.target.value)}>
              <option value="no_determinado">No determinado</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </Select>
          </Field>
          <Field label="Color de cabello">
            <Input value={form.color_cabello} onChange={e => set('color_cabello', e.target.value)} placeholder="Ej. Negro rizado" />
          </Field>
          <Field label="Color de ojos">
            <Input value={form.color_ojos} onChange={e => set('color_ojos', e.target.value)} placeholder="Ej. Cafés oscuros" />
          </Field>
          <Field label="Altura aprox. (cm)">
            <Input type="number" value={form.altura_aproximada_cm} onChange={e => set('altura_aproximada_cm', e.target.value)} placeholder="Ej. 120" />
          </Field>
          <Field label="Ropa al ingreso">
            <Input value={form.ropa_al_ingreso} onChange={e => set('ropa_al_ingreso', e.target.value)} placeholder="Ej. Camiseta azul, pantalón gris" />
          </Field>
        </Grid2>
        <Checkbox label="Tiene cicatrices o marcas visibles" checked={form.tiene_cicatrices} onChange={v => set('tiene_cicatrices', v)} />
        {form.tiene_cicatrices && (
          <Field label="Descripción de cicatrices/marcas">
            <Input value={form.descripcion_cicatrices} onChange={e => set('descripcion_cicatrices', e.target.value)} placeholder="Ej. Cicatriz de 3cm en ceja derecha" />
          </Field>
        )}
      </Section>

      {/* Salud */}
      <Section id="salud" icon={Heart} title="Estado de salud">
        <Grid2>
          <Field label="Condición médica observada">
            <Textarea rows={2} value={form.condicion_medica} onChange={e => set('condicion_medica', e.target.value)} placeholder="Heridas, traumatismos, fiebre..." />
          </Field>
          <Field label="Alergias conocidas">
            <Textarea rows={2} value={form.alergias_conocidas} onChange={e => set('alergias_conocidas', e.target.value)} placeholder="Si el niño menciona alguna..." />
          </Field>
        </Grid2>
        <Field label="Medicamentos requeridos">
          <Input value={form.medicamentos_requeridos} onChange={e => set('medicamentos_requeridos', e.target.value)} placeholder="Nombre y dosis si se conocen..." />
        </Field>
        <Field label="Estado psicoemocional">
          <Select value={form.estado_psicoemocional} onChange={e => set('estado_psicoemocional', e.target.value)}>
            <option value="en_evaluacion">En evaluación</option>
            <option value="estable_cooperativo">Estable, cooperativo</option>
            <option value="angustiado">Angustiado / llanto</option>
            <option value="en_shock">En shock</option>
            <option value="disociado">Disociado / no responde</option>
          </Select>
        </Field>
        <Field label="Notas médicas adicionales">
          <Textarea rows={2} value={form.notas_medicas} onChange={e => set('notas_medicas', e.target.value)} placeholder="Observaciones del personal de salud..." />
        </Field>
        <div className="flex gap-4">
          <Checkbox label="Atendido por médico" checked={form.atendido_por_medico} onChange={v => set('atendido_por_medico', v)} />
          <Checkbox label="Atendido por psicólogo" checked={form.atendido_por_psicologo} onChange={v => set('atendido_por_psicologo', v)} />
        </div>
      </Section>

      {/* Familia */}
      <Section id="familia" icon={Home} title="Información familiar">
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-700">Registrar lo que el niño recuerde. No presionar ni interrogar.</p>
        </div>
        <Grid2>
          <Field label="Nombre del padre">
            <Input value={form.nombre_padre} onChange={e => set('nombre_padre', e.target.value)} placeholder="Nombre completo..." />
          </Field>
          <Field label="Nombre de la madre">
            <Input value={form.nombre_madre} onChange={e => set('nombre_madre', e.target.value)} placeholder="Nombre completo..." />
          </Field>
          <Field label="Nombre del tutor legal">
            <Input value={form.nombre_tutor_legal} onChange={e => set('nombre_tutor_legal', e.target.value)} placeholder="Si aplica..." />
          </Field>
          <Field label="Teléfono familiar recordado">
            <Input value={form.telefono_familiar_recordado} onChange={e => set('telefono_familiar_recordado', e.target.value)} placeholder="0414-000-0000" />
          </Field>
          <Field label="Barrio/sector">
            <Input value={form.barrio_recordado} onChange={e => set('barrio_recordado', e.target.value)} placeholder="Ej. Barrio El Carmen" />
          </Field>
          <Field label="Escuela">
            <Input value={form.escuela_recordada} onChange={e => set('escuela_recordada', e.target.value)} placeholder="Nombre de la escuela..." />
          </Field>
        </Grid2>
        <Field label="Dirección recordada">
          <Input value={form.direccion_recordada} onChange={e => set('direccion_recordada', e.target.value)} placeholder="Calle, casa, referencias..." />
        </Field>
        <Field label="Otros familiares o conocidos mencionados">
          <Textarea rows={2} value={form.otros_familiares_mencionados} onChange={e => set('otros_familiares_mencionados', e.target.value)} placeholder="Tíos, abuelos, vecinos que el niño mencione..." />
        </Field>
      </Section>

      {/* Documentos */}
      <Section id="docs" icon={FileText} title="Documentación disponible">
        <Checkbox label="Tiene documentos físicos consigo" checked={form.tiene_documentos_fisicos} onChange={v => set('tiene_documentos_fisicos', v)} />
        <Grid2>
          <Field label="Número de cédula">
            <Input value={form.cedula_numero} onChange={e => set('cedula_numero', e.target.value)} placeholder="V-00000000" />
          </Field>
          <Field label="Partida de nacimiento">
            <Input value={form.partida_nacimiento_numero} onChange={e => set('partida_nacimiento_numero', e.target.value)} placeholder="Número..." />
          </Field>
          <Field label="Pasaporte">
            <Input value={form.pasaporte_numero} onChange={e => set('pasaporte_numero', e.target.value)} placeholder="Número..." />
          </Field>
        </Grid2>
      </Section>

      {/* Aviso legal */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">
          Al registrar se crea una cadena de custodia oficial bajo la LOPNNA. Tu usuario, fecha y hora quedan registrados de forma permanente. Esta información es confidencial.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Registrando...' : 'Registrar niño y crear expediente'}
        </button>
      </div>
    </form>
  )
}
