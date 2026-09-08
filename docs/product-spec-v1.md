# Especificación Maestra v1 — Diseño Creativo

**Estado:** definición funcional aprobada para planificación  
**Fecha:** 7 de septiembre de 2026  
**Producto:** aplicación interna colaborativa de Diseño Creativo  
**Equipo inicial:** 3 personas

---

## 1. Propósito del producto

Diseño Creativo será el centro operativo del estudio. Debe conectar el recorrido comercial y el trabajo diario en un único sistema sencillo:

**Prospecto → Presupuesto → Seguimiento → Aprobación → Anticipo → Proyecto → Tareas → Revisión → Saldo → Entrega → Cierre**

No pretende copiar todas las funciones de Asana, Trello o un CRM empresarial. Debe resolver el trabajo real de un estudio creativo de tres personas con la menor cantidad posible de módulos, estados y pantallas.

### Principios

1. Una sola fuente de verdad: una tarea, cliente, fecha o pago no debe duplicarse entre módulos.
2. Todo pertenece al espacio compartido de Diseño Creativo.
3. Responsabilidad clara: cada prospecto y cada tarea tienen una persona responsable.
4. La automatización propone; el equipo confirma antes de crear o sobrescribir información importante.
5. Mostrar acciones y trabajo pendiente antes que métricas decorativas.
6. Evitar registros vacíos, módulos placeholder y opciones que todavía no funcionan.
7. La aplicación debe funcionar en tema Claro, Oscuro y Sistema.

---

## 2. Espacio de trabajo y colaboración

### Workspace

Debe existir un espacio de trabajo compartido llamado **Diseño Creativo**.

Todos los clientes, prospectos, presupuestos, proyectos, periodos, tareas, eventos, comentarios, pagos y registros de actividad pertenecen al workspace, no a un usuario individual.

### Visibilidad

- Los tres miembros pueden ver todos los clientes, presupuestos, proyectos, tareas, eventos y pagos del estudio.
- Asignar una persona no oculta el registro a los demás.
- “Mis tareas” filtra por responsabilidad, no por propiedad del proyecto.
- Las consultas nunca deben depender exclusivamente del usuario que creó el registro.

### Roles del MVP

#### Administrador

- Gestionar miembros y configuración.
- Crear, editar y archivar cualquier registro.
- Activar manualmente un proyecto sin anticipo.
- Ejecutar acciones destructivas o excepcionales.

#### Miembro

- Consultar toda la información del estudio.
- Crear y actualizar prospectos, presupuestos, proyectos, tareas, eventos, comentarios y pagos.
- Trabajar en elementos asignados o colaborar en otros.

No se necesitan más roles en el MVP.

---

## 3. Arquitectura de navegación

La navegación principal tendrá cinco elementos:

1. **Inicio**
2. **Trabajo**
3. **Clientes**
4. **Presupuestos**
5. **Agenda**

### Decisiones de simplificación

- Proyectos y Tareas se agrupan dentro de **Trabajo**.
- Pagos deja de ser un módulo principal; se consulta dentro del proyecto, periodo, presupuesto o cliente y mediante resúmenes contextuales.
- La agenda operativa y la agenda comercial se fusionan en una sola **Agenda**.
- Documentos, Equipo e Informes se ocultan hasta que exista una implementación real.
- Presupuestos utiliza el mismo layout, sidebar, tema y patrones visuales que el resto de la aplicación.

### Menú de perfil

Debe contener:

- Perfil.
- Tema: Claro / Oscuro / Sistema.
- Cerrar sesión.
- Gestión del equipo solo para administradores.

---

## 4. Flujo comercial completo

### 4.1 Captura de prospectos

Los canales habituales son:

- Instagram.
- WhatsApp.
- Recomendación.
- Contacto directo.

#### Información mínima

Para guardar un prospecto se exige:

- Nombre o nombre identificable.
- Al menos una vía de contacto.

Campos adicionales:

- Empresa.
- Canal de origen.
- Usuario de Instagram.
- Teléfono.
- Email.
- País.
- Servicio de interés.
- Notas.
- Responsable principal.
- Próxima acción o “Sin seguimiento”.

El email no es obligatorio.

#### Al guardar

Se abre la ficha del prospecto con tres acciones principales:

- Crear presupuesto.
- Agendar seguimiento.
- Añadir nota.

Todos pueden ver y colaborar en el prospecto, pero existe un único responsable principal.

### 4.2 Estados del cliente

- **Prospecto:** existe interés comercial, pero todavía no hay trabajo aprobado.
- **Activo:** tiene al menos un proyecto activo o una relación comercial vigente.
- **Inactivo:** no tiene trabajo actual, pero se conserva la relación.
- **Archivado:** se retira de las vistas normales sin eliminar el historial.

La aprobación de un presupuesto puede convertir un prospecto en cliente activo cuando el proyecto comience.

### 4.3 Creación del presupuesto

El presupuesto puede iniciarse:

- Desde la ficha de un prospecto o cliente, quedando vinculado automáticamente.
- Desde el botón global “Nuevo presupuesto”, eligiendo un cliente existente o proponiendo uno nuevo.

Pulsar “Nuevo presupuesto” no debe persistir inmediatamente un presupuesto vacío.

#### Flujo elegido

1. Conversación guiada con IA.
2. Propuesta estructurada.
3. Revisión manual completa.
4. Confirmación y guardado.
5. Vista previa y exportación en PDF.
6. Marcado manual como enviado.

La IA ayuda a recopilar y organizar datos, pero no toma decisiones finales sobre precios, descuentos, impuestos, condiciones o pagos.

### 4.4 Gestión de clientes desde IA

Si la IA detecta un cliente:

1. Busca posibles coincidencias dentro del workspace.
2. Propone vincular una coincidencia o crear un prospecto.
3. Espera confirmación del usuario.
4. Solo entonces crea o vincula el registro.

La IA no puede crear clientes automáticamente ni buscarlos globalmente fuera del workspace.

### 4.5 Catálogo de servicios

Debe existir un catálogo interno con:

- Nombre.
- Categoría.
- Descripción base.
- Unidad de cobro.
- Precio base.
- Moneda.
- Estado activo/inactivo.

El precio del catálogo sirve como base, pero puede modificarse dentro de cada presupuesto sin alterar el catálogo.

Los servicios fuera del catálogo pueden añadirse como personalizados. La IA debe marcarlos como “sin precio definido” o proponer una cifra para revisión explícita; nunca debe guardar silenciosamente un precio inventado.

### 4.6 Editor estructurado del presupuesto

Antes de confirmar, el equipo puede editar:

- Cliente.
- Título.
- Servicios y descripciones.
- Cantidades.
- Precio unitario.
- Descuentos.
- Impuestos.
- Moneda.
- Fechas.
- Validez.
- Condiciones.
- Porcentaje o importe de anticipo.
- Número de revisiones incluido.
- Total.

El anticipo predeterminado es **50%**, pero puede cambiarse por presupuesto, configurarse como importe fijo, pago completo o sin anticipo.

### 4.7 Estados del presupuesto

- **Borrador**
- **Enviado**
- **Aprobado**
- **Rechazado**
- **Vencido**
- **Archivado**

“Pagado” no es un estado del presupuesto. El estado financiero se calcula a partir del plan de cobro y los pagos reales.

### 4.8 Seguimiento

Al marcar un presupuesto como enviado:

1. El sistema propone una fecha de seguimiento editable.
2. La propuesta inicial puede ser tres días laborables después del envío.
3. El usuario puede cambiarla o quitarla antes de confirmar.
4. El seguimiento aparece en la Agenda y se asigna al responsable del prospecto.

### 4.9 Aprobación y preparación del proyecto

La aprobación se registra manualmente por un miembro del equipo, guardando autor y fecha.

Aprobar no crea automáticamente un proyecto. Habilita la acción **“Preparar proyecto”**.

Esta acción abre una revisión previa con:

- Cliente vinculado.
- Nombre y tipo de proyecto.
- Alcance heredado.
- Importe y moneda.
- Anticipo esperado.
- Fechas propuestas.
- Responsables.
- Proyecto único o mensual.
- Tareas y entregables sugeridos.

La IA puede proponer tareas a partir de los servicios presupuestados. El equipo puede editarlas, eliminarlas, añadir otras, asignar responsables y cambiar fechas. Nada se crea hasta confirmar.

---

## 5. Cobros y activación del proyecto

### Plan esperado

Cada proyecto puede tener:

- Anticipo esperado.
- Saldo esperado.
- Fechas esperadas.

### Pagos reales

Se pueden registrar varios pagos parciales contra el anticipo o el saldo.

El sistema muestra:

- Importe total.
- Anticipo esperado.
- Anticipo recibido.
- Saldo esperado.
- Total recibido.
- Importe pendiente.
- Estado: pendiente, parcial, pagado o vencido.

Un evento de pago en Agenda no equivale a dinero recibido. Solo registrar un pago real modifica los importes cobrados.

### Activación

- Al confirmar “Preparar proyecto”, el proyecto nace como **Planificado / Esperando anticipo**.
- Al completarse el anticipo esperado, pasa automáticamente a **Activo**.
- Un administrador puede activarlo manualmente sin anticipo, dejando registro en la actividad.

---

## 6. Trabajo

Trabajo contiene dos vistas principales:

- **Mis tareas**
- **Proyectos**

También permite consultar **Todo el equipo**.

### 6.1 Mis tareas

Es la vista inicial de Trabajo. Agrupa las tareas asignadas al usuario conectado en:

- Atrasadas.
- Hoy.
- Próximas.
- Sin fecha.

No debe comenzar con gráficas ni múltiples tarjetas de métricas.

### 6.2 Modelo de tarea

Cada tarea incluye:

- Título.
- Descripción opcional.
- Un único responsable principal.
- Proyecto o periodo opcional.
- Indicador de tarea interna.
- Fecha.
- Hora opcional.
- Prioridad opcional.
- Estado.
- Indicación de si requiere revisión.
- Revisor opcional.
- Comentarios.
- Historial básico.

Una tarea puede existir sin cliente ni proyecto como **Tarea interna de Diseño Creativo**.

### 6.3 Estados de tarea

- **Por hacer**
- **En curso**
- **En revisión**
- **Hecha**

“En revisión” solo se utiliza cuando la tarea lo necesita.

- Si no requiere revisión: En curso → Hecha.
- Si requiere revisión: En curso → En revisión → Hecha.
- El revisor puede aprobarla o devolverla a En curso con un comentario.

### 6.4 Comentarios

Cada tarea tiene una conversación interna con:

- Autor.
- Fecha y hora.
- Contenido.
- Respuestas ordenadas cronológicamente.

Los comentarios forman parte del MVP. Menciones, archivos adjuntos y notificaciones avanzadas quedan para una fase posterior.

### 6.5 Proyectos

La lista de proyectos permite cambiar entre lista y tablero.

Estados:

- **Planificado**
- **Activo**
- **Esperando al cliente**
- **En revisión**
- **Completado**
- **Archivado**

La ficha del proyecto prioriza tres áreas:

1. **Resumen:** cliente, equipo, fechas, alcance, cobros y próximos hitos.
2. **Tareas:** tablero o lista de tareas y entregables.
3. **Actividad:** cambios, comentarios y registros importantes.

No se deben mostrar pestañas vacías de Documentos, Pagos o Agenda. Esa información se integra de forma contextual en Resumen hasta necesitar vistas propias.

---

## 7. Proyectos recurrentes mensuales

El MVP admite proyectos únicos y proyectos mensuales.

### Estructura

**Proyecto mensual → Periodo → Tareas → Entregables → Cobros → Cierre del periodo**

Cada periodo tiene:

- Mes y año.
- Fecha de inicio y cierre.
- Estado.
- Tareas.
- Entregables.
- Miembros.
- Importe y moneda.
- Plan de cobro.
- Pagos reales.

### Creación del siguiente periodo

El sistema propone el siguiente periodo antes de finalizar el actual, pero requiere confirmación.

El flujo es:

1. Aparece “Preparar [mes siguiente]”.
2. Se copian como borrador las tareas y entregables reutilizables.
3. Se revisan responsables, fechas, alcance e importe.
4. El equipo confirma.
5. Solo entonces se crea el periodo.

No se generan meses vacíos automáticamente.

---

## 8. Agenda unificada

Debe existir una sola Agenda para:

- Tareas con fecha.
- Tareas internas.
- Reuniones.
- Seguimientos comerciales.
- Revisiones.
- Entregas.
- Recordatorios.
- Pagos esperados.

### Vista inicial

- Vista predeterminada: **Semana**.
- Alcance predeterminado: **Todo el equipo**.
- Vistas adicionales: Mes y Lista.
- Filtros: responsable, proyecto/cliente y tipo de elemento.

### Crear desde Agenda

El botón “Nuevo” permite elegir:

- Tarea.
- Evento o reunión.
- Seguimiento.

Una tarea creada desde Agenda es la misma entidad que aparece en Trabajo y Proyecto. No existe una categoría separada de “tareas de agenda”.

Campos rápidos de tarea:

- Título.
- Proyecto o Tarea interna.
- Responsable.
- Fecha.
- Hora opcional.
- Prioridad opcional.

### Sincronización

- Toda tarea con fecha aparece automáticamente en Agenda.
- Las tareas sin hora aparecen como “Todo el día”.
- Reprogramar desde Agenda modifica la fecha real de la tarea.
- Cambiarla desde Trabajo actualiza Agenda.
- Marcarla como hecha se refleja en todas las vistas.
- Los pagos esperados son recordatorios; no se consideran pagos recibidos.

---

## 9. Inicio

Inicio debe responder:

1. ¿Qué tengo que hacer hoy?
2. ¿Qué está atrasado o bloqueado?
3. ¿Qué entrega, reunión, seguimiento o pago viene próximamente?

### Contenido

- Mis tareas de hoy y atrasadas.
- Proyectos que requieren atención.
- Próximos eventos y entregas.
- Pagos pendientes solo cuando existan.
- Actividad reciente con nombres comprensibles.
- Acciones rápidas: nuevo prospecto, presupuesto, tarea o evento.

### Restricciones visuales

- Evitar filas de tarjetas con valores cero.
- No mostrar IDs internos.
- No crear tarjetas diferentes para cada dato pequeño.
- Priorizar listas accionables sobre métricas.
- El dashboard se termina después de conectar los flujos principales.

---

## 10. Tema y sistema visual

### Opciones

- **Claro**
- **Oscuro**
- **Sistema**

Sistema es la opción predeterminada y sigue `prefers-color-scheme`. Si cambia la apariencia de macOS mientras la app está abierta, la interfaz debe actualizarse.

La preferencia explícita del usuario debe persistir entre sesiones y dispositivos cuando sea viable. Debe aplicarse antes del primer render para evitar destellos de tema incorrecto.

### Reglas

- Usar tokens semánticos para fondo, texto, superficies, bordes, popovers y estados.
- No hardcodear `bg-black`, `bg-white`, `text-black` o `text-white` en estructuras principales.
- Los PDF mantienen colores propios y no dependen del tema de la aplicación.
- El mismo sistema visual se usa en todos los módulos.
- Mantener una interfaz limpia, con pocas tarjetas y un acento principal consistente.

---

## 11. Estados y entidades objetivo

### Entidades principales

- Workspace.
- WorkspaceMember.
- User.
- Client.
- Service.
- PricingRule.
- Quote.
- QuoteLineItem.
- QuoteStatusHistory.
- QuoteNote.
- ConversationMessage.
- Project.
- ProjectPeriod.
- WorkItem.
- TaskComment.
- WorkAssignment.
- Event.
- PaymentSchedule o ExpectedPayment.
- Payment.
- ActivityRecord.

### Relaciones esenciales

- Todo registro operativo pertenece a un Workspace.
- Client pertenece a Workspace.
- Quote pertenece a Workspace y puede vincular Client.
- Project pertenece a Workspace y debe utilizar clientId como fuente relacional.
- Project puede provenir de Quote.
- WorkItem pertenece a Workspace y puede vincular Project y ProjectPeriod.
- WorkItem tiene un responsable.
- Event pertenece a Workspace y puede vincular cliente, proyecto, periodo o seguimiento.
- ExpectedPayment define lo que debe cobrarse.
- Payment registra dinero realmente recibido.
- ActivityRecord debe poder referenciar directamente presupuesto, tarea, evento o pago.

---

## 12. Alcance del MVP

### Incluido

- Workspace compartido para tres personas.
- Roles Administrador y Miembro.
- Prospectos y clientes.
- Presupuestos asistidos por IA con revisión manual.
- Catálogo de servicios con precios base editables.
- Seguimiento comercial en Agenda.
- Preparación manual de proyecto desde presupuesto aprobado.
- Anticipo y saldo con pagos parciales.
- Proyectos únicos y mensuales.
- Tareas internas o de proyecto.
- Un responsable por tarea.
- Revisión opcional.
- Comentarios en tareas.
- Agenda unificada.
- Tema Claro, Oscuro y Sistema.

### Fuera del MVP

- Portal de clientes.
- Aprobación directa por el cliente.
- Archivos adjuntos y biblioteca documental.
- Subtareas.
- Dependencias complejas entre tareas.
- Estimaciones y control horario.
- Menciones y notificaciones avanzadas.
- Recurrencias semanales o personalizadas.
- Facturación fiscal.
- Informes avanzados.
- Aplicación móvil nativa.

---

## 13. Migración desde la aplicación actual

### Conservar y evolucionar

- Autenticación con Supabase.
- Prisma y PostgreSQL.
- Modelos existentes de presupuestos.
- Exportación PDF.
- Proyectos recurrentes y ProjectPeriod.
- Pagos parciales e idempotencia.
- Ficha de proyecto como base operativa.
- Componentes UI compartidos y tokens CSS.

### Fusionar

- `/projects` y `/tasks` dentro de Trabajo.
- `/agenda` y `/presupuestos/agenda` en una Agenda única.
- Sidebar operativo y sidebar de Presupuestos en un solo shell.
- Cliente textual de Project y relación `clientId`, migrando hacia la relación.

### Corregir antes de ampliar UI

- Crear Workspace y WorkspaceMember.
- Añadir `workspaceId` y políticas de acceso homogéneas.
- Dar visibilidad a miembros asignados y al equipo completo.
- Dejar de filtrar proyectos únicamente por propietario.
- Añadir responsable y estado real a WorkItem.
- Separar pago esperado de pago recibido.
- Conectar presupuesto aprobado con preparación de proyecto.
- Evitar la creación de presupuestos y clientes vacíos.
- Ampliar ActivityRecord para relaciones reales.
- Corregir el ciclo de borrado/archivado de proyectos.

### Ocultar o retirar

- Documentos hasta que exista un modelo real.
- Equipo e Informes mientras sean placeholders.
- Agenda comercial independiente.
- Pagos como navegación principal durante el MVP.
- Estado PAID de Quote como representación financiera.
- Componentes huérfanos o widgets no montados después de verificar que no tienen consumidor.

---

## 14. Fases de implementación

### Fase 0 — Seguridad, workspace y migración

- Backup verificable.
- Crear Workspace y membresías.
- Vincular los tres usuarios.
- Migrar clientes y datos existentes.
- Unificar reglas de acceso.
- Resolver propiedad compartida frente a autor y responsable.
- Corregir referencia Git remota inválida y documentación técnica necesaria.

### Fase 1 — Flujo comercial

- Prospectos.
- Responsable y seguimiento.
- Presupuesto IA sin creación prematura.
- Editor manual completo.
- Catálogo seguro.
- Estados y seguimiento.
- Preparar proyecto desde presupuesto aprobado.

### Fase 2 — Trabajo colaborativo

- Navegación Trabajo.
- Mis tareas.
- Responsable individual.
- Estados.
- Revisión opcional.
- Comentarios.
- Tareas internas.
- Vistas de proyecto.

### Fase 3 — Pagos y activación

- Anticipo esperado y saldo.
- Pagos parciales reales.
- Activación por anticipo.
- Excepción administrativa registrada.
- Estados financieros derivados.

### Fase 4 — Agenda única

- Fusionar agendas.
- Semana como vista inicial.
- Tareas y eventos en la misma línea temporal.
- Creación de tareas desde Agenda.
- Reprogramación sincronizada.
- Filtros del equipo.

### Fase 5 — Periodos mensuales

- Preparación del siguiente periodo.
- Copia revisable de tareas y entregables.
- Cobros por periodo.
- Cierre mensual.

### Fase 6 — Shell, tema y pulido UX/UI

- Navegación definitiva.
- Layout único.
- Claro/Oscuro/Sistema.
- Responsive.
- Accesibilidad.
- Estados vacíos, carga y error.
- Eliminación de placeholders y tarjetas innecesarias.

### Fase 7 — Inicio e informes esenciales

- Inicio accionable derivado de datos reales.
- Próximos vencimientos.
- Cobros pendientes.
- Carga de trabajo.
- Métricas comerciales mínimas.

---

## 15. Requisitos transversales

### Integridad

- No crear registros persistentes por abrir una pantalla.
- Ninguna IA elimina o reemplaza datos revisados sin confirmación.
- Todas las mutaciones relevantes generan actividad con actor y fecha.
- Las acciones destructivas requieren confirmación.
- Archivar es preferible a eliminar cuando existe historial relacionado.

### Accesibilidad

- Documento en español (`lang="es"`).
- Un `h1` real por pantalla.
- Modales semánticos, foco controlado y cierre con Escape.
- Controles iconográficos con nombre accesible.
- Objetivos táctiles adecuados.
- Contraste WCAG AA en ambos temas.
- Soporte de `prefers-reduced-motion`.

### Experiencia

- Español consistente.
- Fechas y horas en formato local configurable.
- Estados vacíos contextuales.
- Errores claros y recuperables.
- Sin IDs internos visibles como títulos.
- Sin módulos falsos ni mensajes de desarrollo.
- Formularios cortos con ampliación progresiva.

---

## 16. Criterios de aceptación del producto

La primera versión se considera coherente cuando:

1. Los tres miembros trabajan sobre el mismo workspace.
2. Un prospecto puede capturarse con nombre y una vía de contacto.
3. Un presupuesto se genera con IA, se revisa manualmente y no existe hasta confirmarlo.
4. Enviar un presupuesto propone un seguimiento visible en Agenda.
5. Aprobar un presupuesto habilita “Preparar proyecto”, sin crear uno automáticamente.
6. El proyecto hereda datos y tareas propuestas, pero requiere confirmación.
7. El anticipo esperado es 50% editable y admite pagos parciales reales.
8. El proyecto se activa al completar el anticipo o mediante excepción administrativa registrada.
9. Cada tarea tiene un responsable y puede incluir comentarios.
10. Las tareas internas existen sin cliente ni proyecto.
11. Una tarea con fecha aparece en Trabajo y Agenda sin duplicarse.
12. Agenda abre en Semana, muestra al equipo y permite filtrar.
13. Los proyectos mensuales preparan el siguiente periodo y esperan confirmación.
14. Toda la app comparte navegación, componentes y sistema de temas.
15. Claro, Oscuro y Sistema funcionan sin colores estructurales hardcodeados.
16. Las pantallas no dependen de tarjetas vacías para explicar su contenido.

---

## 17. Decisiones diferidas

Estas decisiones no bloquean el inicio y se resolverán en fases posteriores:

- Días predeterminados de validez de un presupuesto.
- Intervalo exacto predeterminado para seguimientos.
- Notificaciones dentro de la aplicación, email o push.
- Integración con Apple Calendar u otros calendarios.
- Archivos adjuntos y almacenamiento.
- Portal y aprobaciones del cliente.
- Informes financieros avanzados.
- Facturación fiscal.

Esta especificación es la fuente de verdad funcional. Si la implementación actual contradice una regla aquí definida, debe documentarse la diferencia y proponerse una migración segura antes de cambiar datos.
