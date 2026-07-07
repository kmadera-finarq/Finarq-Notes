# Espacio de equipo

App real de organización de equipo (tipo Notion) con inicio de sesión con
Google, grupos, y actividades en un tablero kanban colaborativo en tiempo
real. Construida con **Next.js 16 + Supabase** (Postgres, Auth, Realtime).

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta / un proyecto nuevo.
2. En **SQL Editor**, pega y ejecuta todo el contenido de `sql/schema.sql`.
   Esto crea las tablas (`profiles`, `groups`, `group_members`, `tasks`), los
   permisos (RLS) y el trigger que crea un perfil automáticamente cuando
   alguien inicia sesión por primera vez.
3. En **Project settings > API**, copia:
   - `Project URL`
   - `anon public key`

## 2. Activar el login con Google

1. En Google Cloud Console (console.cloud.google.com):
   - Crea un proyecto (o usa uno existente).
   - Ve a "APIs y servicios > Pantalla de consentimiento OAuth" y
     configúrala (tipo "Externo" está bien para empezar).
   - Ve a "Credenciales > Crear credenciales > ID de cliente de OAuth",
     tipo Aplicación web.
   - En "URI de redirección autorizados" agrega:
     `https://TU-PROYECTO.supabase.co/auth/v1/callback`
     (reemplaza TU-PROYECTO por el ID de tu proyecto de Supabase).
   - Copia el Client ID y Client secret.
2. En Supabase: Authentication > Providers > Google.
   - Actívalo y pega el Client ID y Client secret.
3. En Supabase: Authentication > URL Configuration.
   - Site URL: `http://localhost:3000` (cámbialo a tu dominio real cuando despliegues).
   - Redirect URLs: agrega `http://localhost:3000/auth/callback` (y la
     versión con tu dominio de producción más adelante).

## 3. Configurar el proyecto localmente

    cp .env.local.example .env.local

Edita `.env.local` con los valores de tu proyecto de Supabase:

    NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
    NEXT_PUBLIC_SITE_URL=http://localhost:3000

Instala dependencias y corre en local:

    npm install
    npm run dev

Abre `http://localhost:3000`, inicia sesión con Google, crea un grupo y
empieza a asignar actividades. Si abres la app en dos pestañas o dos
cuentas, verás los cambios sincronizarse en tiempo real.

## 4. Desplegar (recomendado: Vercel)

1. Sube este proyecto a un repositorio de GitHub.
2. En vercel.com, importa el repositorio.
3. Agrega las mismas variables de entorno (NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL con tu dominio
   de Vercel, ej. https://tu-app.vercel.app).
4. Despliega.
5. Vuelve a Supabase > Authentication > URL Configuration y agrega tu
   dominio de producción a Site URL y Redirect URLs
   (https://tu-app.vercel.app/auth/callback).
6. En Google Cloud Console no necesitas cambiar nada más: el redirect
   sigue apuntando a Supabase, no a Vercel.

## Estructura del proyecto

    sql/schema.sql              Esquema de base de datos + RLS + triggers
    src/app/login                Página de inicio de sesión con Google
    src/app/auth/callback        Intercambio del código OAuth por sesión
    src/app/dashboard            Carga los datos iniciales (Server Component)
    src/app/actions              Server Actions: crear/editar grupos y tareas
    src/components/Workspace.tsx Estado en tiempo real + orquesta la UI
    src/components/Sidebar.tsx   Lista de grupos
    src/components/Board.tsx     Tablero kanban con arrastrar y soltar
    src/components/Modals.tsx    Modales: nuevo grupo, nueva actividad, detalle
    src/lib/supabase             Clientes de Supabase (browser, server, middleware)

## Notas sobre permisos

Las políticas de RLS en `sql/schema.sql` están pensadas para una
herramienta interna de confianza: cualquier persona que inicie sesión
puede ver y editar todos los grupos y actividades, igual que en la versión
original. Si más adelante quieres que cada grupo sólo sea visible para sus
integrantes, dime y ajustamos las políticas para restringirlo por
membresía en group_members.
