# Despliegue de workspace y autorización

Este procedimiento aplica la Fase 0 a la base real. La propietaria ha aceptado
un snapshot lógico ligero como medida de emergencia: no es una restauración
completa de Supabase. Los datos operativos se recuperarán por *best effort*,
con prioridad absoluta para Servicios, reglas de precios y reglas de descuento.

No ejecutar ningún paso sin una ventana de mantenimiento y revisión humana de
los resultados. No guardar contraseñas, tokens ni conexiones en el repositorio.

## 1. Detener escrituras

Activar mantenimiento o bloquear temporalmente altas y cambios de clientes,
presupuestos, proyectos, tareas, eventos y pagos. Esperar a que finalicen las
operaciones que ya estén en curso.

**Recuperación:** si todavía no se aplicó ningún cambio de datos, retirar
mantenimiento y continuar con la versión vigente.

## 2. Crear y verificar el snapshot ligero

Crear un snapshot con `npm run snapshot:business -- --output-dir
/Users/kevincastillo/Backups/diseno-creativo` y conservar la carpeta con
permisos privados fuera del repositorio. Verificar JSON, checksum, conteos y
que el catálogo incluye todos los servicios, precios y descuentos. Registrar
ruta, checksum y conteos antes de seguir.

Esta copia no sustituye un backup físico restaurable. Sirve para recuperar por
*best effort* los datos del dominio, especialmente el catálogo.

**Recuperación:** si falla la exportación, los conteos no coinciden o el catálogo
no está completo, no avanzar. Corregir la causa y crear un snapshot nuevo.

## 3. Aplicar la migración aditiva

Aplicar exclusivamente la migración de Fase 0A para `Workspace`,
`WorkspaceMember` y las columnas nullable `workspaceId`. No aplicar todavía
RLS, `NOT NULL`, restricciones compuestas, backfill ni cambios contractivos.

**Recuperación:** la migración es aditiva. Si falla, mantener mantenimiento y
volver al código vigente. No borrar columnas ni tablas manualmente.

## 4. Crear el workspace y su única membresía inicial

Ejecutar primero el bootstrap con `--dry-run`. Después crear o reutilizar
`Diseño Creativo` y añadir únicamente
`kevincastillo3001@outlook.com:ADMIN`. No añadir la cuenta Gmail de prueba. Los
otros miembros se incorporarán más adelante.

**Recuperación:** si el dry-run no coincide con lo esperado, no ejecutar el
bootstrap. Si se añade una membresía equivocada, mantener mantenimiento y
corregir sólo esa membresía mediante una operación revisada; no modificar Auth.

## 5. Ensayar el backfill sin escribir

Usar el ID o el nombre del workspace y ejecutar:

```sh
npm run backfill:workspace -- --workspace-name "Diseño Creativo" --dry-run
```

Revisar los conteos por entidad raíz y confirmar que no informa conflictos. El
script sólo puede asignar filas con `workspaceId = NULL`; nunca reemplaza el
workspace de filas ya asignadas.

**Recuperación:** un conflicto cancela el proceso sin cambios. Investigar las
relaciones informadas y no continuar hasta resolverlas.

## 6. Ejecutar el backfill real

Ejecutar una sola vez, dentro de mantenimiento:

```sh
npm run backfill:workspace -- --workspace-name "Diseño Creativo"
```

El script trabaja en una transacción, actualiza solamente Client, Service,
Quote, Project, WorkItem, Event y ActivityRecord sin workspace, y verifica
relaciones de entidades hijas antes y después. No borra, archiva, recrea ni
renombra registros.

**Recuperación:** si falla, la transacción revierte. Mantener mantenimiento,
conservar el snapshot y resolver la causa antes de reintentar. Como no hay
backup restaurable completo, no continuar con una base parcialmente modificada.

## 7. Validar contra el snapshot

Ejecutar la validación con la ruta exacta del snapshot aprobado:

```sh
npm run validate:workspace-backfill -- \
  --workspace-name "Diseño Creativo" \
  --snapshot "/Users/kevincastillo/Backups/diseno-creativo/<fecha>/business-snapshot.json" \
  --admin-email "kevincastillo3001@outlook.com" \
  --excluded-email "kevincas3008@gmail.com"
```

Debe confirmar que Outlook es `ADMIN`, Gmail no tiene membresía, no quedan
raíces con `workspaceId = NULL`, los IDs y conteos coinciden con el snapshot,
no hay relaciones huérfanas y el catálogo conserva servicios, reglas de precio
y reglas de descuento. El inventario de referencia actual es 41 servicios y 77
reglas de precio; si el snapshot aprobado contiene otro número, ese valor es la
referencia válida.

**Recuperación:** si falla una comprobación, mantener mantenimiento. Usar el
snapshot para reconstrucción por *best effort* sólo después de determinar la
causa; no desplegar Fase 0B.

## 8. Desplegar Fase 0B y hacer smoke tests

Desplegar el commit que limita los datos por workspace. Con Outlook, comprobar
lectura y creación de cliente, presupuesto, proyecto, tarea, evento y pago,
más chat y PDF. Confirmar que una cuenta sin membresía recibe acceso denegado.

**Recuperación:** si los smoke tests fallan, volver a mantenimiento y revertir
la versión de aplicación. No aplicar restricciones contractivas mientras haya
incertidumbre sobre datos.

## 9. Retirar mantenimiento y aplazar restricciones contractivas

Reabrir escrituras sólo después de aceptar validación y smoke tests. Observar
los errores de autorización y los intentos de crear raíces sin `workspaceId`.

Una fase posterior podrá aplicar `NOT NULL`, claves compuestas y RLS. Esa fase
necesita su propio plan de recuperación; no se incluye en este despliegue.
