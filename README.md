# Presupuestador Inteligente KEVS

App web para generar presupuestos profesionales del estudio KEVS (webs, diseño de redes, fotografía), con asistencia de IA para calcular y explicar precios.

Ver [`PRD.md`](./PRD.md) para los requisitos completos del producto y [`ROADMAP.md`](./ROADMAP.md) para las fases de desarrollo.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Prisma 7 + PostgreSQL (Supabase) + Supabase Auth.

## 1. Requisitos previos

- Node.js 20.9+ (recomendado usar la misma versión con la que se generó el proyecto).
- Una cuenta gratuita en [Supabase](https://supabase.com).

## 2. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un nuevo proyecto (elige una contraseña de base de datos y guárdala).
2. Ve a **Project Settings → API** y copia:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`.
   - `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Ve a **Project Settings → Database → Connection string**:
   - Copia la cadena en modo **Transaction pooling** (puerto `6543`) → será `DATABASE_URL`.
   - Copia la cadena de conexión **directa** (puerto `5432`) → será `DIRECT_URL`.
4. Ve a **Authentication → Users** y crea manualmente tu usuario (Kevs) con email y contraseña. En el MVP no hay pantalla de registro pública — el único usuario se crea desde el panel de Supabase.

## 3. Configurar variables de entorno

Copia `.env.example` a `.env` (si no existe ya) y completa los valores obtenidos en el paso anterior:

```bash
cp .env.example .env
```

`GEMINI_API_KEY` es necesaria desde ya: la pantalla principal es un chat que usa Gemini para armar presupuestos. Consíguela gratis en [Google AI Studio](https://aistudio.google.com/apikey).

## 4. Instalar dependencias y preparar la base de datos

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

Esto crea las tablas definidas en `prisma/schema.prisma` (usuarios, clientes, servicios, reglas de precio, presupuestos, líneas de presupuesto e historial de estados) y carga el catálogo inicial de servicios (`prisma/seed.ts`): Webs/Página básica, Diseño de redes/Carrusel y Post normal, Fotografía (sin precio, pendiente de configurar).

Después, crea en la base de datos un registro `User` cuyo `id` coincida con el `id` del usuario que creaste en Supabase Auth (paso 2.4) — esto conecta la cuenta de login con los datos de la app. Puedes hacerlo con Prisma Studio:

```bash
npx prisma studio
```

## 5. Levantar la app en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — te pedirá iniciar sesión (`/login`) con el usuario creado en el paso 2.4, y luego muestra el chat para armar presupuestos.

## Estructura relevante

```
prisma/schema.prisma            Modelo de datos (User, Client, Service, PricingRule, Quote, ...)
prisma/seed.ts                  Carga inicial del catálogo de servicios
src/lib/prisma.ts               Cliente Prisma (singleton) para consultas a la base de datos
src/lib/supabase/client.ts      Cliente Supabase para el navegador
src/lib/supabase/server.ts      Cliente Supabase para Server Components / Server Actions
src/lib/current-user.ts         Resuelve el usuario de Supabase Auth a la fila de `users`
src/lib/gemini.ts               Cliente de Google GenAI (Gemini) — lee GEMINI_API_KEY
src/lib/chat-tools.ts           Herramientas (function calling) que el chat usa contra Prisma
src/proxy.ts                    Refresca la sesión y protege rutas (equivalente a middleware.ts)
src/app/login/                  Pantalla de login y server actions de signIn/signOut
src/app/api/chat/route.ts       Endpoint del chat: loop de function calling + streaming NDJSON
src/components/chat/ChatPanel.tsx  UI del chat (pantalla principal, /)
src/app/quotes/[id]/page.tsx    Vista de solo lectura de un presupuesto generado
```

## Notas técnicas

- **Next.js 16**: usa Turbopack por defecto y renombró `middleware.ts` a `proxy.ts` (mismo comportamiento).
- **Prisma 7**: las connection strings ya no van en `schema.prisma`, sino en `prisma.config.ts` (para el CLI) y se pasan como *driver adapter* (`@prisma/adapter-pg`) al construir `PrismaClient` en tiempo de ejecución (ver `src/lib/prisma.ts`). El comando de seed también se configura ahí (`migrations.seed`).
- El cliente generado de Prisma vive en `src/generated/prisma` y se regenera automáticamente con `npx prisma generate` (por eso está en `.gitignore`, no se versiona).
- **IA (Gemini)**: el chat usa el SDK oficial [`@google/genai`](https://www.npmjs.com/package/@google/genai) con el modelo `gemini-2.5-flash`. El endpoint `src/app/api/chat/route.ts` implementa un loop manual de *function calling*: llama a `generateContentStream`, ejecuta las herramientas de `src/lib/chat-tools.ts` (buscar/crear cliente, listar catálogo, crear presupuesto) contra Prisma, y reenvía las respuestas (texto y resultado de herramientas) al cliente en streaming.
