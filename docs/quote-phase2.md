# Fase 2 — Presupuestos unificados

`/presupuestos/nuevo` mantiene la conversación/propuesta y la revisión estructurada en el navegador. No crea `Quote`, `ConversationMessage` ni `Client` al abrir, cerrar o recargar. Al confirmar, crea un presupuesto con líneas, precios editables, anticipo y el contacto elegido; si la propuesta representa un contacto nuevo, lo crea entonces como prospecto tras validar duplicados del workspace.

Los seguimientos de un presupuesto enviado son `Event` de tipo `FOLLOW_UP`, vinculados al presupuesto y al contacto, por lo que se ven en `/agenda`. La ruta histórica `/presupuestos/agenda` redirige a esa Agenda.

Los estados nuevos `READY_TO_SEND` y `EXPIRED` son aditivos. `PAID` se conserva para datos históricos, pero el flujo nuevo no lo usa como estado financiero. Los cambios de estado nuevos conservan `changedById` y fecha. Aprobar convierte el prospecto vinculado al mismo `Client` en cliente y no crea ningún proyecto.

## Preparar proyecto — Fase 3

Un presupuesto aprobado muestra la acción informativa **Preparar proyecto · Fase 3**. No hay mutación de `Project` en Fase 2. La fase siguiente deberá abrir una revisión editable y confirmar explícitamente cliente, alcance, tipo, importe, anticipo, responsables, fechas y tareas antes de crear el proyecto.

## Backfill posterior a la migración

Después de aplicar la migración aditiva, ejecutar en producción:

```sh
node --env-file=.env --import tsx scripts/backfill-quote-phase2.ts --workspace-id "$WORKSPACE_ID" --dry-run
node --env-file=.env --import tsx scripts/backfill-quote-phase2.ts --workspace-id "$WORKSPACE_ID"
```

Solo completa `responsibleId` de presupuestos y `changedById` del historial cuando son nulos. No modifica IDs, importes, líneas, clientes, proyectos ni estados.
