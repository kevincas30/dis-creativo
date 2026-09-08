# Despliegue de workspace y autorización

Este procedimiento aplica la Fase 0 sobre una base real. No debe ejecutarse desde desarrollo sin una ventana de mantenimiento, un backup restaurable y una persona responsable de validar cada punto. No contiene contraseñas, tokens ni cadenas de conexión.

## 1. Activar mantenimiento o detener escrituras

Bloquear inicios de flujos que creen o modifiquen datos: clientes, presupuestos, proyectos, tareas, eventos y pagos. Confirmar que no quedan procesos de escritura en curso.

**Recuperación:** si todavía no se aplicó una migración ni se escribió dato alguno, retirar mantenimiento y volver a operar con la versión vigente. Si ya hubo cambios, mantener el bloqueo hasta decidir entre continuar o restaurar el backup validado.

## 2. Crear y verificar un backup restaurable

Crear un backup lógico con acceso al esquema de aplicación y, si el mecanismo lo permite, al esquema `auth`. Restaurarlo en una base aislada y comparar esquema y conteos básicos antes de continuar. Registrar la hora, identificador y resultado de la restauración.

**Recuperación:** no seguir si la restauración no es verificable. Mantener mantenimiento, corregir permisos o mecanismo de backup y crear uno nuevo.

## 3. Aplicar la migración aditiva

Aplicar exclusivamente la migración de Fase 0A que crea `Workspace`, `WorkspaceMember` y las columnas opcionales `workspaceId`. Verificar que no aplica restricciones contractivas, RLS, backfill ni cambios de roles de PostgreSQL.

**Recuperación:** la migración es aditiva. Si falla antes de completarse, mantener mantenimiento y restaurar la base aislada o producción desde el backup según el estado confirmado. Si termina pero el siguiente paso se bloquea, conservar las columnas nullable y volver temporalmente al código anterior; no borrar tablas ni columnas manualmente.

## 4. Crear el workspace “Diseño Creativo”

Ejecutar el bootstrap parametrizable con el nombre `Diseño Creativo`, primero en modo `--dry-run` y después dentro de su transacción. Confirmar el ID resultante del workspace y que sólo se creó o reutilizó ese workspace.

**Recuperación:** si el dry-run no coincide con lo esperado, no ejecutar el modo de escritura. Si el bootstrap falla, su transacción debe revertir; inspeccionar el estado antes de reintentarlo. Si queda un workspace creado sin datos asociados, restaurar desde backup o corregir mediante una operación revisada, nunca con borrados improvisados.

## 5. Añadir únicamente el administrador inicial

Añadir `kevincastillo3001@outlook.com` como miembro con rol `ADMIN`. Verificar que el correo corresponde a un usuario existente en `public.users` y `auth.users`. No añadir la cuenta Gmail de prueba.

**Recuperación:** si se asigna un usuario equivocado, mantener mantenimiento y corregir únicamente la membresía errónea mediante una transacción revisada. No modificar ni desactivar cuentas de Auth. Si no puede demostrarse el estado previo, restaurar el backup validado.

## 6. Confirmar que no se añadió la cuenta Gmail de prueba

Consultar las membresías del workspace y verificar que sólo está la cuenta Outlook indicada en el paso anterior. Los otros miembros se incorporarán después mediante el bootstrap o una operación administrativa futura.

**Recuperación:** si aparece la cuenta de prueba, retirarla de la membresía antes de cualquier backfill. Si existen dudas sobre qué datos pudo consultar, mantener mantenimiento e investigar antes de reabrir la aplicación.

## 7. Ejecutar el backfill de datos históricos

Asignar el `workspaceId` de Diseño Creativo a todas las entidades raíz históricas: clientes, servicios, presupuestos, proyectos, tareas, eventos y actividad. Las entidades hijas conservan el ámbito de su padre. No renombrar `userId`, no cambiar `Project.client` y no eliminar el presupuesto de prueba conocido.

**Recuperación:** ejecutar el backfill en transacciones por lote con registro de conteos. Ante un fallo, detener el proceso y restaurar el backup si no se puede identificar con precisión qué lotes se aplicaron. No activar el código de Fase 0B contra una base parcialmente rellenada.

## 8. Validar datos antes del despliegue

Comparar conteos previos y posteriores, validar relaciones y confirmar que no quedan entidades raíz operativas con `workspaceId = NULL`. Revisar específicamente clientes, servicios, presupuestos, proyectos, tareas, eventos y actividad; validar también que las entidades hijas pertenecen a su presupuesto o proyecto padre.

**Recuperación:** ante conteos, relaciones o nulos inesperados, mantener mantenimiento, detener el despliegue y restaurar el backup o repetir el backfill sólo desde un estado verificable.

## 9. Desplegar el código con autorización de workspace

Desplegar la versión que filtra raíces por `workspaceId`, conserva `userId` como creador histórico y no usa fallback global para valores NULL. Confirmar que las variables de entorno y la conexión de Prisma no cambian rol ni RLS.

**Recuperación:** si el despliegue falla antes de aceptar tráfico, revertir la versión de aplicación y mantener la migración aditiva. Si falla después, volver a la versión anterior sólo si el mantenimiento sigue activo y los datos ya tienen backfill completo; de lo contrario restaurar el backup validado.

## 10. Ejecutar smoke tests autenticados

Con el administrador inicial, comprobar lectura y creación de cliente, presupuesto, proyecto, tarea, evento y pago; comprobar PDF y chat. Probar que una cuenta sin membresía recibe acceso denegado y que un miembro posterior puede ver datos del workspace compartido. No usar datos reales para ensayos destructivos.

**Recuperación:** si falla un smoke test, volver a mantenimiento, recopilar el error sin exponer secretos y revertir la aplicación o restaurar el backup según si el problema es sólo código o también datos.

## 11. Desactivar mantenimiento

Retirar el bloqueo únicamente cuando los smoke tests, conteos y relaciones hayan sido aceptados. Monitorizar errores de autorización y de registros con `workspaceId` durante la primera ventana operativa.

**Recuperación:** si aparecen errores de acceso o datos fuera de ámbito, reactivar mantenimiento inmediatamente, conservar evidencias y aplicar el rollback definido en los pasos 7 a 10.

## 12. Reservar restricciones contractivas para una fase posterior

No aplicar todavía `NOT NULL`, claves foráneas compuestas, eliminación de campos legados ni RLS funcional. Planificar esa fase después de observar el sistema y confirmar la ausencia sostenida de raíces con `workspaceId = NULL`.

**Recuperación:** al no aplicar cambios contractivos en esta fase, se conserva la opción de volver temporalmente a código compatible. Las restricciones futuras deben tener su propio backup, ensayo de restauración y plan de rollback.
