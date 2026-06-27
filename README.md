# ReuniFamilia

Sistema web de emergencia para registro, gestión y reunificación de niños no acompañados en situación de desastre. Desarrollado bajo el marco legal de la LOPNNA (Venezuela) y la Convención ONU sobre Derechos del Niño.

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Tailwind CSS**
- **Vercel** (deploy)

## Módulos

| Módulo | Descripción |
|---|---|
| Niños | Registro completo con foto, descripción física, salud, familia y documentos |
| Reunificación | Proceso legal de 5 pasos con audit trail inmutable |
| Refugios | Gestión de refugios con capacidad y servicios en tiempo real |
| Audit Log | Registro inmutable de todas las acciones del sistema |
| Usuarios | Gestión de acceso por roles |

## Roles

| Rol | Permisos |
|---|---|
| `operador_refugio` | Registra niños de su refugio, avanza pasos 1-3 de reunificación |
| `coordinador_regional` | Ve todos los refugios, transfiere niños, gestión completa |
| `autoridad_legal` | Único que puede aprobar el Paso 4 (resolución CPNNA) |
| `administrador` | Acceso total, gestión de usuarios |

## Setup

### 1. Clonar e instalar
```bash
git clone https://github.com/TU_USUARIO/reunifamilia.git
cd reunifamilia
npm install
```

### 2. Crear proyecto en Supabase
Ir a [supabase.com](https://supabase.com) → New project

### 3. Ejecutar el schema SQL
En **Supabase Dashboard → SQL Editor**:
```
Abrir el archivo: supabase/schema.sql
Copiar todo el contenido y ejecutar
```

### 4. Crear Storage buckets
En **Supabase Dashboard → Storage → New bucket**:
- `fotos-menores` (private)
- `documentos-identidad` (private)
- `actas-oficiales` (private)

### 5. Crear usuario administrador
En **Supabase Dashboard → Authentication → Users → Add user**:
- Email: `admin@reunifamilia.ve`
- Password: (una contraseña segura)

Luego en **SQL Editor**:
```sql
INSERT INTO usuarios (id, nombre_completo, cedula, rol)
VALUES ('<UUID_DEL_USUARIO_CREADO>', 'Administrador', 'V-00000000', 'administrador');
```

### 6. Variables de entorno
Copiar `.env.example` → `.env.local` y completar con tus credenciales de Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```

### 7. Deploy en Vercel
```bash
# Conectar repo a vercel.com → Import Project
# Agregar las 3 variables de entorno en el panel de Vercel
# Deploy automático en cada push a main
```

## Marco legal

Este sistema implementa los **5 pasos obligatorios** del protocolo LOPNNA para reunificación de menores:

1. Registro de solicitud del reclamante
2. Verificación de identidad del reclamante
3. Verificación del vínculo familiar con documentos
4. Autorización oficial del CPNNA (solo `autoridad_legal`)
5. Acta formal de entrega con 2 testigos

> ⚠️ La entrega de menores sin completar los 5 pasos constituye un delito bajo el Art. 272 de la LOPNNA.

## Licencia

Uso humanitario. Sistema desarrollado para situaciones de emergencia.
