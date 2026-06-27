'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock } from 'lucide-react'

interface Props {
  solicitudId: string
  ninoId: string
  paso: number
  canAdvancePaso4: boolean
  canAdvance: boolean
}

export default function PasoActions({ solicitudId, ninoId, paso, canAdvancePaso4, canAdvance }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Campos por paso
  const [cedula_cotejada, setCedulaCotejada] = useState(false)
  const [foto_coincide, setFotoCoincide] = useState(false)
  const [docs_vinculo, setDocsVinculo] = useState<string[]>([])
  const [notas_vinculo, setNotasVinculo] = useState('')
  const [resolucion, setResolucion] = useState('')
  const [notas_autorizacion, setNotasAutorizacion] = useState('')
  const [testigo1_nombre, setTestigo1Nombre] = useState('')
  const [testigo1_cedula, setTestigo1Cedula] = useState('')
  const [testigo2_nombre, setTestigo2Nombre] = useState('')
  const [testigo2_cedula, setTestigo2Cedula] = useState('')
  const [motivo_rechazo, setMotivoRechazo] = useState('')
  const [showRechazo, setShowRechazo] = useState(false)

  const DOCS_DISPONIBLES = [
    'Partida de nacimiento del menor',
    'Partida de nacimiento del padre/madre',
    'Acta matrimonial',
    'Documento notariado de parentesco',
    'Cédula del tutor legal',
    'Testigos presenciales identificados',
  ]

  const toggleDoc = (doc: string) => {
    setDocsVinculo(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc])
  }

  const advance = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const now = new Date().toISOString()

      let updates: Record<string, unknown> = {}
      let nuevoEstado = ''

      if (paso === 1) {
        updates = { paso_actual: 2, estado: 'paso_2_identidad_verificada' }
        nuevoEstado = 'paso_2_identidad_verificada'
      } else if (paso === 2) {
        if (!cedula_cotejada || !foto_coincide) {
          setError('Debes confirmar que la cédula fue cotejada y que la foto coincide.')
          setLoading(false)
          return
        }
        updates = { paso_actual: 3, estado: 'paso_3_vinculo_documentado', vinculo_verificado_por: user!.id, vinculo_verificado_en: now }
        nuevoEstado = 'paso_3_vinculo_documentado'
      } else if (paso === 3) {
        if (docs_vinculo.length < 1) {
          setError('Debes marcar al menos un documento de verificación de vínculo.')
          setLoading(false)
          return
        }
        updates = { paso_actual: 4, estado: 'paso_4_autoridad_aprobada', documentos_vinculo: docs_vinculo, notas_verificacion_vinculo: notas_vinculo || null }
        nuevoEstado = 'paso_4_autoridad_aprobada'
      } else if (paso === 4) {
        if (!canAdvancePaso4) {
          setError('Solo una Autoridad Legal (CPNNA) puede completar este paso.')
          setLoading(false)
          return
        }
        if (!resolucion.trim()) {
          setError('El número de resolución CPNNA es obligatorio.')
          setLoading(false)
          return
        }
        updates = { paso_actual: 5, estado: 'paso_5_entrega_completada', numero_resolucion_cpnna: resolucion, autorizado_por: user!.id, autorizado_en: now, notas_autorizacion: notas_autorizacion || null }
        nuevoEstado = 'paso_5_entrega_completada'
      } else if (paso === 5) {
        if (!testigo1_nombre || !testigo1_cedula || !testigo2_nombre || !testigo2_cedula) {
          setError('Se requieren 2 testigos identificados para completar la entrega.')
          setLoading(false)
          return
        }
        updates = {
          paso_actual: 5,
          estado: 'paso_5_entrega_completada',
          entrega_completada_por: user!.id,
          entrega_completada_en: now,
          testigo_1_nombre: testigo1_nombre, testigo_1_cedula: testigo1_cedula,
          testigo_2_nombre: testigo2_nombre, testigo_2_cedula: testigo2_cedula,
        }
        // Actualizar estado del niño a reunificado
        await supabase.from('ninos').update({ estado: 'reunificado', ultima_actualizacion_por: user!.id }).eq('id', ninoId)
      }

      const { error: upErr } = await supabase.from('solicitudes_reunificacion').update(updates).eq('id', solicitudId)
      if (upErr) throw upErr

      // Audit log
      await supabase.from('audit_log').insert({
        accion: paso === 5 ? 'entrega_completada' : `avance_paso_${paso + 1}`,
        entidad_tipo: 'solicitud',
        entidad_id: solicitudId,
        usuario_id: user!.id,
        detalles: { paso_anterior: paso, nino_id: ninoId },
      })

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al procesar. Intenta de nuevo.')
    }
    setLoading(false)
  }

  const rechazar = async () => {
    if (!motivo_rechazo.trim()) {
      setError('Debes indicar el motivo del rechazo.')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('solicitudes_reunificacion').update({ estado: 'rechazada', motivo_rechazo }).eq('id', solicitudId)
    await supabase.from('audit_log').insert({
      accion: 'solicitud_rechazada',
      entidad_tipo: 'solicitud',
      entidad_id: solicitudId,
      usuario_id: user!.id,
      detalles: { motivo: motivo_rechazo },
    })
    router.refresh()
    setLoading(false)
  }

  if (!canAdvance && paso !== 4) {
    return <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Sin permisos para avanzar este paso.</p>
  }
  if (paso === 4 && !canAdvancePaso4) {
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700 flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          Este paso solo puede completarlo una Autoridad Legal (CPNNA). Comparte el número de solicitud con la autoridad competente.
        </p>
        <p className="text-xs font-mono text-amber-800 mt-1">ID: {solicitudId}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600 p-2 bg-red-50 rounded-lg">{error}</p>}

      {paso === 2 && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={cedula_cotejada} onChange={e => setCedulaCotejada(e.target.checked)} className="w-4 h-4 rounded text-red-600" />
            <span className="text-sm text-slate-700">Cédula cotejada presencialmente con el reclamante</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={foto_coincide} onChange={e => setFotoCoincide(e.target.checked)} className="w-4 h-4 rounded text-red-600" />
            <span className="text-sm text-slate-700">Foto de la cédula coincide con la persona presente</span>
          </label>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Marcar documentos de parentesco presentados (mínimo 1):</p>
          {DOCS_DISPONIBLES.map(doc => (
            <label key={doc} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={docs_vinculo.includes(doc)} onChange={() => toggleDoc(doc)} className="w-4 h-4 rounded text-red-600" />
              <span className="text-xs text-slate-700">{doc}</span>
            </label>
          ))}
          <textarea
            value={notas_vinculo}
            onChange={e => setNotasVinculo(e.target.value)}
            placeholder="Notas adicionales sobre la verificación del vínculo..."
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={2}
          />
        </div>
      )}

      {paso === 4 && canAdvancePaso4 && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Número de resolución CPNNA *</label>
            <input
              value={resolucion}
              onChange={e => setResolucion(e.target.value)}
              placeholder="Ej. CV-2026-001234"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <textarea
            value={notas_autorizacion}
            onChange={e => setNotasAutorizacion(e.target.value)}
            placeholder="Notas de la autorización..."
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={2}
          />
        </div>
      )}

      {paso === 5 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Testigos del acto formal de entrega:</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={testigo1_nombre} onChange={e => setTestigo1Nombre(e.target.value)} placeholder="Testigo 1 — Nombre" className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <input value={testigo1_cedula} onChange={e => setTestigo1Cedula(e.target.value)} placeholder="Testigo 1 — Cédula" className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <input value={testigo2_nombre} onChange={e => setTestigo2Nombre(e.target.value)} placeholder="Testigo 2 — Nombre" className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <input value={testigo2_cedula} onChange={e => setTestigo2Cedula(e.target.value)} placeholder="Testigo 2 — Cédula" className="text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={advance}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Procesando...' : paso === 5 ? 'Confirmar entrega formal' : `Confirmar y avanzar al paso ${paso + 1}`}
        </button>
        {!showRechazo && paso <= 4 && (
          <button onClick={() => setShowRechazo(true)} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors">
            Rechazar solicitud
          </button>
        )}
      </div>

      {showRechazo && (
        <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-medium text-red-700">Motivo del rechazo (obligatorio):</p>
          <textarea
            value={motivo_rechazo}
            onChange={e => setMotivoRechazo(e.target.value)}
            className="w-full text-xs border border-red-300 rounded-lg px-3 py-2 focus:outline-none"
            rows={2}
            placeholder="Describe el motivo del rechazo..."
          />
          <div className="flex gap-2">
            <button onClick={rechazar} disabled={loading} className="px-3 py-1.5 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800 disabled:opacity-60">
              Confirmar rechazo
            </button>
            <button onClick={() => setShowRechazo(false)} className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
