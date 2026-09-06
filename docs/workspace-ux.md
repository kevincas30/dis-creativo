# Simplificación del workspace

## Arquitectura y alcance

- El layout `(dashboard)` autentica con `getCurrentUser()` y monta `GlobalSidebar`, `MobileTopBar` y `MobileDrawer`. Presupuestos IA conserva su layout y sidebar independientes.
- Clientes, Project, Event, Quote y QuoteStatusHistory tienen persistencia real en Prisma. Project no tiene relación directa con Quote; no se crea esa relación en esta intervención.
- `/tasks`, `/payments`, `/team` y `/reports` son pantallas pendientes de desarrollo. No existe un modelo Task, ni prioridad ni estado de finalización de eventos.
- Los seis widgets originales de Inicio (StatsGrid, QuickAccessGrid, RecentProjectsCard, RecentActivityCard, PendingPaymentsCard y UpcomingMeetingsCard) presentaban ejemplos o enlaces redundantes. Se conservan sus archivos, pero Inicio deja de montar los widgets de ejemplo.

## Fases

1. Cinco destinos principales. Agenda comercial y Pagos en Más, con las mismas rutas. Equipo y Reportes siguen disponibles por URL. Presupuestos IA navega en la misma pestaña; conserva su enlace de regreso.
2. Inicio operativo con datos del usuario autenticado: compromisos de agenda de hoy, proyectos no finalizados y actividad de presupuestos. Sin inventar tareas ni controles de completar sobre eventos que no tienen ese estado.
3. Acciones: crear presupuesto mediante la acción existente y proyecto con el modal existente. Sin nuevos contratos, tablas ni migraciones.
4. Comprobar TypeScript, lint, build y casos de fechas/priorización; verificar rutas sin modificar datos reales.

## Criterios de datos

- Hoy sigue el día local del servidor, como la creación de eventos existente. No se cambia la convención horaria en esta poda.
- Los eventos que se solapan con hoy se incluyen; los que terminan exactamente a medianoche se excluyen. Se muestran como compromisos, no como tareas.
- Requieren atención los proyectos no finalizados que están en revisión o tienen fecha de entrega hoy o vencida. Se ordenan antes que los otros proyectos activos, sin duplicarlos. Las fechas de entrega se interpretan como fecha de calendario (el formulario guarda YYYY-MM-DD en UTC).
- Máximo seis proyectos visibles, con enlace al módulo completo y conteo total. La actividad inferior reutiliza el historial real de Presupuestos IA.
- La falta de tareas se comunica como funcionalidad aún no disponible, sin afirmar que hay cero pendientes reales.
- La autenticación, el modelo de datos, las integraciones y las rutas secundarias se mantienen.

## Verificación realizada

- TypeScript sin errores (`npx tsc --noEmit`).
- ESLint sin errores (`npm run lint`).
- Build de producción correcto (`npm run build`), con todas las rutas anteriores presentes.
- Cuatro pruebas de clasificación, fechas y estados vacíos (`node --import tsx --test src/lib/workspace-summary.test.ts`).
- Consultas nuevas ejecutadas en modo lectura contra la base de datos: eventos, proyectos e historial accesibles. Sin creación ni modificación de registros de prueba.
- `/login` responde 200 y `/projects` sin sesión redirige a `/login` (307).
- No se ha realizado una prueba visual en navegador con sesión autenticada ni operaciones de creación sobre datos reales.
- Durante TypeScript se corrigió un acceso a `error.status` potencialmente indefinido en el cambio previo del login. Se conserva el resto de ese cambio.
