# Bootstrap del workspace

La Fase 0A añade la estructura local de `Workspace`, `WorkspaceMember` y los
campos `workspaceId` opcionales. La migración todavía no debe aplicarse a una
base de datos hasta completar el backup, la restauración probada y la revisión
de la Fase 0B.

## Precondiciones

- La migración `20260908090000_add_workspace_foundation` se ha aplicado en un
  entorno autorizado.
- Cada persona que se vaya a añadir existe tanto en Supabase Auth como en
  `public.users`.
- Se ha decidido al menos un administrador del workspace.
- La ejecución se hace con una conexión de base de datos autorizada. El script
  no crea usuarios de Auth ni perfiles públicos.

## Uso posterior

Primero revisar el resultado sin escribir:

```bash
npx tsx scripts/bootstrap-workspace.ts \
  --workspace-name "Diseño Creativo" \
  --member "id-o-email-del-admin:ADMIN" \
  --member "id-o-email-del-miembro:MEMBER" \
  --dry-run
```

Cuando el resultado sea correcto, repetir el mismo comando sin `--dry-run`.
El bootstrap se ejecuta en una transacción, busca los usuarios por ID o email y
es idempotente: reutiliza el workspace con el mismo nombre, conserva
membresías iguales y solo actualiza un rol cuando el comando solicita otro.

No incluye backfill de `workspaceId`, RLS, cambios de datos históricos ni la
creación de usuarios. Esas tareas pertenecen a las fases posteriores del plan
expand/contract.
