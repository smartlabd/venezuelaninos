-- ============================================================
-- REUNIFAMILIA — SCHEMA COMPLETO
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: refugios
-- ============================================================
CREATE TABLE refugios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  municipio TEXT NOT NULL,
  estado_venezuela TEXT NOT NULL DEFAULT 'Distrito Capital',
  capacidad_maxima INTEGER NOT NULL DEFAULT 20,
  telefono_principal TEXT,
  telefono_secundario TEXT,
  coordinador_nombre TEXT NOT NULL,
  coordinador_cedula TEXT,
  tiene_medico BOOLEAN DEFAULT FALSE,
  tiene_psicologo BOOLEAN DEFAULT FALSE,
  tiene_agua_potable BOOLEAN DEFAULT TRUE,
  tiene_alimentacion BOOLEAN DEFAULT TRUE,
  tiene_electricidad BOOLEAN DEFAULT TRUE,
  tiene_acceso_vehicular BOOLEAN DEFAULT TRUE,
  notas_operativas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  latitud DECIMAL(10,8),
  longitud DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  cedula TEXT UNIQUE,
  telefono TEXT,
  rol TEXT NOT NULL CHECK (rol IN (
    'operador_refugio',
    'coordinador_regional',
    'autoridad_legal',
    'administrador'
  )),
  refugio_id UUID REFERENCES refugios(id),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: ninos
-- ============================================================
CREATE TABLE ninos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_emergencia TEXT UNIQUE NOT NULL,

  nombre TEXT,
  apellido TEXT,
  nombre_no_identificado TEXT DEFAULT 'Sin identificar',
  edad_aproximada INTEGER,
  genero TEXT CHECK (genero IN ('masculino', 'femenino', 'no_determinado')) DEFAULT 'no_determinado',
  fecha_nacimiento DATE,

  descripcion_fisica TEXT NOT NULL,
  color_cabello TEXT,
  color_ojos TEXT,
  altura_aproximada_cm INTEGER,
  tiene_cicatrices BOOLEAN DEFAULT FALSE,
  descripcion_cicatrices TEXT,
  ropa_al_ingreso TEXT,

  foto_url TEXT,
  foto_adicional_1_url TEXT,
  foto_adicional_2_url TEXT,

  estado TEXT NOT NULL DEFAULT 'registrado' CHECK (estado IN (
    'registrado',
    'en_busqueda',
    'reclamado',
    'en_proceso_legal',
    'reunificado',
    'custodia_institucional'
  )),

  refugio_id UUID NOT NULL REFERENCES refugios(id),
  refugio_anterior_id UUID REFERENCES refugios(id),

  urgencia_medica TEXT NOT NULL DEFAULT 'estable' CHECK (urgencia_medica IN ('critico', 'moderado', 'estable')),
  condicion_medica TEXT,
  alergias_conocidas TEXT,
  medicamentos_requeridos TEXT,
  estado_psicoemocional TEXT DEFAULT 'en_evaluacion' CHECK (estado_psicoemocional IN (
    'en_evaluacion',
    'estable_cooperativo',
    'angustiado',
    'en_shock',
    'disociado'
  )),
  notas_medicas TEXT,
  atendido_por_medico BOOLEAN DEFAULT FALSE,
  atendido_por_psicologo BOOLEAN DEFAULT FALSE,

  nombre_padre TEXT,
  nombre_madre TEXT,
  nombre_tutor_legal TEXT,
  telefono_familiar_recordado TEXT,
  direccion_recordada TEXT,
  barrio_recordado TEXT,
  escuela_recordada TEXT,
  otros_familiares_mencionados TEXT,

  cedula_numero TEXT,
  partida_nacimiento_numero TEXT,
  pasaporte_numero TEXT,
  tiene_documentos_fisicos BOOLEAN DEFAULT FALSE,

  registrado_por UUID NOT NULL REFERENCES usuarios(id),
  registrado_en TIMESTAMPTZ DEFAULT NOW(),
  ultima_actualizacion_por UUID REFERENCES usuarios(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: solicitudes_reunificacion
-- ============================================================
CREATE TABLE solicitudes_reunificacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nino_id UUID NOT NULL REFERENCES ninos(id),

  reclamante_nombre TEXT NOT NULL,
  reclamante_cedula TEXT NOT NULL,
  reclamante_telefono TEXT NOT NULL,
  reclamante_parentesco TEXT NOT NULL CHECK (reclamante_parentesco IN (
    'padre','madre','abuelo_a','tio_a','hermano_a',
    'tutor_legal','otro_familiar','vecino_conocido'
  )),
  reclamante_parentesco_descripcion TEXT,
  reclamante_direccion TEXT,
  reclamante_foto_cedula_url TEXT,
  reclamante_foto_presencial_url TEXT,

  paso_actual INTEGER NOT NULL DEFAULT 1 CHECK (paso_actual BETWEEN 1 AND 5),
  estado TEXT NOT NULL DEFAULT 'paso_1_solicitud' CHECK (estado IN (
    'paso_1_solicitud',
    'paso_2_identidad_verificada',
    'paso_3_vinculo_documentado',
    'paso_4_autoridad_aprobada',
    'paso_5_entrega_completada',
    'rechazada',
    'suspendida'
  )),

  documentos_vinculo TEXT[],
  vinculo_verificado_por UUID REFERENCES usuarios(id),
  vinculo_verificado_en TIMESTAMPTZ,
  notas_verificacion_vinculo TEXT,

  numero_resolucion_cpnna TEXT,
  autorizado_por UUID REFERENCES usuarios(id),
  autorizado_en TIMESTAMPTZ,
  notas_autorizacion TEXT,

  acta_entrega_url TEXT,
  entrega_completada_por UUID REFERENCES usuarios(id),
  entrega_completada_en TIMESTAMPTZ,
  testigo_1_nombre TEXT,
  testigo_1_cedula TEXT,
  testigo_2_nombre TEXT,
  testigo_2_cedula TEXT,

  motivo_rechazo TEXT,
  recibida_por UUID NOT NULL REFERENCES usuarios(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: documentos
-- ============================================================
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidad_tipo TEXT NOT NULL CHECK (entidad_tipo IN ('nino', 'solicitud', 'refugio')),
  entidad_id UUID NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN (
    'foto_menor','cedula_reclamante','partida_nacimiento',
    'acta_matrimonial','documento_notariado','resolucion_cpnna',
    'acta_entrega','foto_ropa_ingreso','informe_medico',
    'informe_psicologico','otro'
  )),
  nombre_archivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tamanio_bytes INTEGER,
  subido_por UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: audit_log (inmutable)
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accion TEXT NOT NULL,
  entidad_tipo TEXT NOT NULL,
  entidad_id UUID,
  usuario_id UUID REFERENCES usuarios(id),
  usuario_nombre TEXT,
  detalles JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: transferencias_refugio
-- ============================================================
CREATE TABLE transferencias_refugio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nino_id UUID NOT NULL REFERENCES ninos(id),
  refugio_origen_id UUID NOT NULL REFERENCES refugios(id),
  refugio_destino_id UUID NOT NULL REFERENCES refugios(id),
  motivo TEXT NOT NULL,
  autorizado_por UUID NOT NULL REFERENCES usuarios(id),
  completada BOOLEAN DEFAULT FALSE,
  completada_en TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: notas_seguimiento
-- ============================================================
CREATE TABLE notas_seguimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nino_id UUID NOT NULL REFERENCES ninos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('medica','psicologica','familiar','legal','operativa','general')),
  contenido TEXT NOT NULL,
  es_urgente BOOLEAN DEFAULT FALSE,
  creada_por UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECUENCIA Y FUNCIÓN: código de emergencia
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS codigo_emergencia_seq START 1;

CREATE OR REPLACE FUNCTION generar_codigo_emergencia()
RETURNS TEXT AS $$
DECLARE
  anio TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  numero TEXT := LPAD(nextval('codigo_emergencia_seq')::TEXT, 4, '0');
BEGIN
  RETURN 'VEN-' || anio || '-' || numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refugios_updated_at BEFORE UPDATE ON refugios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ninos_updated_at BEFORE UPDATE ON ninos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER solicitudes_updated_at BEFORE UPDATE ON solicitudes_reunificacion FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: audit automático en ninos
-- ============================================================
CREATE OR REPLACE FUNCTION audit_nino_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(accion, entidad_tipo, entidad_id, detalles)
    VALUES ('registro_nino', 'nino', NEW.id, jsonb_build_object(
      'codigo', NEW.codigo_emergencia,
      'nombre', COALESCE(NEW.nombre || ' ' || NEW.apellido, 'Sin identificar'),
      'refugio_id', NEW.refugio_id,
      'urgencia', NEW.urgencia_medica
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.estado != NEW.estado THEN
      INSERT INTO audit_log(accion, entidad_tipo, entidad_id, detalles)
      VALUES ('cambio_estado_nino', 'nino', NEW.id, jsonb_build_object(
        'estado_anterior', OLD.estado,
        'estado_nuevo', NEW.estado,
        'codigo', NEW.codigo_emergencia
      ));
    END IF;
    IF OLD.refugio_id != NEW.refugio_id THEN
      INSERT INTO audit_log(accion, entidad_tipo, entidad_id, detalles)
      VALUES ('transferencia_refugio', 'nino', NEW.id, jsonb_build_object(
        'refugio_anterior', OLD.refugio_id,
        'refugio_nuevo', NEW.refugio_id,
        'codigo', NEW.codigo_emergencia
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_ninos AFTER INSERT OR UPDATE ON ninos FOR EACH ROW EXECUTE FUNCTION audit_nino_changes();

-- ============================================================
-- TRIGGER: audit en solicitudes
-- ============================================================
CREATE OR REPLACE FUNCTION audit_solicitud_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(accion, entidad_tipo, entidad_id, detalles)
    VALUES ('nueva_solicitud_reunificacion', 'solicitud', NEW.id, jsonb_build_object(
      'nino_id', NEW.nino_id,
      'reclamante', NEW.reclamante_nombre,
      'parentesco', NEW.reclamante_parentesco
    ));
  ELSIF TG_OP = 'UPDATE' AND OLD.paso_actual != NEW.paso_actual THEN
    INSERT INTO audit_log(accion, entidad_tipo, entidad_id, detalles)
    VALUES ('avance_paso_reunificacion', 'solicitud', NEW.id, jsonb_build_object(
      'nino_id', NEW.nino_id,
      'paso_anterior', OLD.paso_actual,
      'paso_nuevo', NEW.paso_actual,
      'estado', NEW.estado
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_solicitudes AFTER INSERT OR UPDATE ON solicitudes_reunificacion FOR EACH ROW EXECUTE FUNCTION audit_solicitud_changes();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE refugios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ninos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_reunificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_refugio ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_seguimiento ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_refugio_id()
RETURNS UUID AS $$
  SELECT refugio_id FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- refugios
CREATE POLICY "refugios_select" ON refugios FOR SELECT TO authenticated USING (activo = true OR get_user_rol() = 'administrador');
CREATE POLICY "refugios_insert" ON refugios FOR INSERT TO authenticated WITH CHECK (get_user_rol() IN ('administrador','coordinador_regional'));
CREATE POLICY "refugios_update" ON refugios FOR UPDATE TO authenticated USING (get_user_rol() IN ('administrador','coordinador_regional'));

-- usuarios
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT TO authenticated USING (id = auth.uid() OR get_user_rol() IN ('administrador','coordinador_regional','autoridad_legal'));
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT TO authenticated WITH CHECK (get_user_rol() = 'administrador');
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE TO authenticated USING (id = auth.uid() OR get_user_rol() = 'administrador');

-- ninos
CREATE POLICY "ninos_select" ON ninos FOR SELECT TO authenticated USING (
  get_user_rol() IN ('coordinador_regional','autoridad_legal','administrador')
  OR (get_user_rol() = 'operador_refugio' AND refugio_id = get_user_refugio_id())
);
CREATE POLICY "ninos_insert" ON ninos FOR INSERT TO authenticated WITH CHECK (
  get_user_rol() IN ('operador_refugio','coordinador_regional','administrador')
);
CREATE POLICY "ninos_update" ON ninos FOR UPDATE TO authenticated USING (
  get_user_rol() IN ('coordinador_regional','autoridad_legal','administrador')
  OR (get_user_rol() = 'operador_refugio' AND refugio_id = get_user_refugio_id())
);

-- solicitudes
CREATE POLICY "solicitudes_select" ON solicitudes_reunificacion FOR SELECT TO authenticated USING (
  get_user_rol() IN ('coordinador_regional','autoridad_legal','administrador')
  OR (get_user_rol() = 'operador_refugio' AND nino_id IN (SELECT id FROM ninos WHERE refugio_id = get_user_refugio_id()))
);
CREATE POLICY "solicitudes_insert" ON solicitudes_reunificacion FOR INSERT TO authenticated WITH CHECK (
  get_user_rol() IN ('operador_refugio','coordinador_regional','administrador')
);
CREATE POLICY "solicitudes_update" ON solicitudes_reunificacion FOR UPDATE TO authenticated USING (
  get_user_rol() IN ('coordinador_regional','autoridad_legal','administrador')
  OR (get_user_rol() = 'operador_refugio' AND nino_id IN (SELECT id FROM ninos WHERE refugio_id = get_user_refugio_id()))
);

-- documentos
CREATE POLICY "docs_select" ON documentos FOR SELECT TO authenticated USING (
  get_user_rol() IN ('coordinador_regional','autoridad_legal','administrador') OR subido_por = auth.uid()
);
CREATE POLICY "docs_insert" ON documentos FOR INSERT TO authenticated WITH CHECK (true);

-- audit_log
CREATE POLICY "audit_select" ON audit_log FOR SELECT TO authenticated USING (get_user_rol() IN ('administrador','coordinador_regional','autoridad_legal'));
CREATE POLICY "audit_insert" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- notas
CREATE POLICY "notas_select" ON notas_seguimiento FOR SELECT TO authenticated USING (
  get_user_rol() IN ('coordinador_regional','autoridad_legal','administrador')
  OR (get_user_rol() = 'operador_refugio' AND nino_id IN (SELECT id FROM ninos WHERE refugio_id = get_user_refugio_id()))
);
CREATE POLICY "notas_insert" ON notas_seguimiento FOR INSERT TO authenticated WITH CHECK (true);

-- transferencias
CREATE POLICY "transferencias_select" ON transferencias_refugio FOR SELECT TO authenticated USING (get_user_rol() IN ('coordinador_regional','autoridad_legal','administrador'));
CREATE POLICY "transferencias_insert" ON transferencias_refugio FOR INSERT TO authenticated WITH CHECK (get_user_rol() IN ('coordinador_regional','administrador'));

-- ============================================================
-- STORAGE POLICIES (ejecutar después de crear los buckets)
-- ============================================================
-- Crear manualmente en Storage Dashboard:
--   fotos-menores      (privado)
--   documentos-identidad (privado)
--   actas-oficiales    (privado)

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT INTO refugios (nombre, direccion, municipio, estado_venezuela, capacidad_maxima, coordinador_nombre, tiene_medico, tiene_agua_potable, tiene_alimentacion) VALUES
  ('Refugio El Paraíso', 'Av. Principal El Paraíso, frente al parque', 'Libertador', 'Distrito Capital', 25, 'Prof. Ana Brito', true, true, true),
  ('Centro Comunal Libertador', 'Calle Norte 3, Barrio San Agustín', 'Libertador', 'Distrito Capital', 20, 'Lic. Pedro Vera', false, true, true),
  ('Escuela Básica Los Teques', 'Av. Bolívar km 2', 'Guaicaipuro', 'Miranda', 30, 'Dir. Rosa Medina', true, true, true),
  ('Unidad Educativa Petare', 'Calle principal, sector Las Minas', 'Sucre', 'Miranda', 20, 'Prof. Carlos Díaz', false, true, false);

-- ============================================================
-- DESPUÉS DE CREAR USUARIO ADMIN EN SUPABASE AUTH:
-- Reemplaza <UUID> con el id del usuario creado
-- ============================================================
-- INSERT INTO usuarios (id, nombre_completo, cedula, rol)
-- VALUES ('<UUID>', 'Administrador Sistema', 'V-00000000', 'administrador');
