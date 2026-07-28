# ROADMAP — Presupuestador Inteligente KEVS

Basado en `PRD.md`. Fases pensadas para llegar a un MVP usable por Kevs lo antes posible, dejando explícitamente fuera (backlog) todo lo que no es imprescindible. No se inicia desarrollo hasta autorización explícita.

---

## Fase 0 — Fundaciones técnicas
**Objetivo:** dejar la base del proyecto lista para construir features sobre ella.
- Confirmar stack técnico (sección 16 del PRD) con Kevs.
- Setup del repo, estructura del proyecto, entorno de desarrollo.
- Definir y crear el modelo de datos inicial: `User`, `Client`, `Service`, `PricingRule` (por moneda/mercado), `Quote` (presupuesto), `QuoteLineItem`, `QuoteStatusHistory`.
- Autenticación básica de un solo usuario (Kevs).
- **Entregable:** app desplegable vacía, con login funcionando y base de datos conectada.

## Fase 1 — Gestión de servicios y clientes (CRUD base)
**Objetivo:** que Kevs pueda cargar y mantener su catálogo sin ayuda de desarrollo.
- Pantalla de gestión de servicios: crear/editar/desactivar servicio, definir precios de referencia por moneda (MXN/EUR) y por defecto impuestos (16%/21%).
- Pantalla de gestión de clientes: crear/editar cliente, ver historial de presupuestos asociados (vacío por ahora).
- Carga inicial del catálogo real: Webs, Diseño de redes (carrusel/post), Fotografía (placeholder sin precio).
- **Entregable:** Kevs puede administrar servicios y clientes desde la UI.

## Fase 2 — Cuestionario guiado por servicio
**Objetivo:** capturar los factores que determinan el precio de cada tipo de servicio.
- Diseñar la estructura de preguntas por servicio (webs: páginas/complejidad/urgencia; redes: tipo de pieza/cantidad/revisiones; fotografía: a definir cuando Kevs configure el servicio).
- Motor de formularios dinámicos según el servicio seleccionado.
- Persistencia de las respuestas asociadas al presupuesto en borrador.
- **Entregable:** flujo "elegir servicio → responder cuestionario" funcionando de punta a punta (sin cálculo de precio todavía).

## Fase 3 — Motor de cálculo de precios + descuentos
**Objetivo:** convertir las respuestas del cuestionario en un desglose de precio con explicación.
- Lógica de cálculo por servicio (reglas configurables: base + ajustes por complejidad/cantidad/urgencia).
- Generación del texto explicativo del cálculo ("cómo se llegó a este número").
- Aplicación de descuentos (porcentaje o monto fijo, a nivel línea o total) con motivo opcional.
- Edición manual de cualquier línea/precio después del cálculo automático.
- **Entregable:** al completar el cuestionario, se genera un desglose editable con precio total y explicación, sin IA todavía (reglas manuales/configurables).

## Fase 4 — IA: desglose automático y precios de mercado
**Objetivo:** incorporar la asistencia de IA definida como núcleo diferencial del producto.
- Integración con modelo Claude vía API.
- Generación asistida por IA del desglose y la redacción (explicación del cálculo + copy de venta del servicio) a partir de las respuestas del cuestionario.
- Investigación de factibilidad técnica y prototipo de "búsqueda de precio de mercado actual" (requiere capacidad de búsqueda web) para sugerir precios por servicio/moneda/mercado — resultado siempre editable, nunca automático sin revisión.
- Actualización asistida del catálogo de precios de referencia por mercado (MXN/EUR) a partir de estas sugerencias.
- **Entregable:** el presupuesto se genera con ayuda de IA (desglose + sugerencia de precio de mercado + texto persuasivo), revisable por Kevs antes de continuar.

## Fase 5 — Documento final y exportación a PDF
**Objetivo:** producir el entregable real que se envía al cliente.
- Plantilla de PDF con marca KEVS (logo, colores) — requiere assets de marca de Kevs.
- Estructura del documento: descripción de venta del servicio, desglose detallado, condiciones comerciales (pago, revisiones), tiempos de entrega, oferta/descuento si aplica, fecha de emisión y validez de la propuesta.
- Plantilla de texto base con secciones condicionales según servicio y respuestas del cuestionario.
- Botón "Imprimir/Generar PDF" desde el presupuesto.
- **Entregable:** de un presupuesto en la app se genera un PDF final listo para enviar al cliente.

## Fase 6 — Historial y gestión de estados
**Objetivo:** que ningún presupuesto se pierda y se pueda dar seguimiento.
- Estados del presupuesto: Borrador, Enviado, Aceptado, Rechazado (cambio manual por Kevs).
- Listado de historial con búsqueda/filtro por cliente, estado, fecha, servicio.
- Función "Duplicar presupuesto" como punto de partida para uno nuevo.
- Vista de cliente mostrando todos sus presupuestos pasados (para detectar recurrencia).
- **Entregable:** historial completo y funcional — cierre del MVP funcional.

## Fase 7 — Pulido, QA y lanzamiento interno
**Objetivo:** dejar la app lista para uso diario real de Kevs.
- Revisión de UI/UX de principio a fin del flujo completo.
- Pruebas con datos reales de los tres servicios (incluyendo fotografía una vez Kevs defina precios).
- Corrección de bugs, validaciones de formularios, manejo de errores (ej. fallo en búsqueda de mercado de la IA → fallback a precio de referencia guardado).
- **Entregable: MVP en uso real por Kevs.**

---

## Backlog post-MVP (fases futuras, no planificadas en detalle todavía)

Quedan documentadas para no perderlas, se priorizarán después de validar el MVP en uso real:

- **Multi-usuario y roles:** invitar a los 2 miembros adicionales del equipo, permisos diferenciados.
- **Arquitectura SaaS multi-tenant:** aislar datos por estudio para vender la app a terceros.
- **Portal de cliente:** aprobar/comentar presupuestos online vía link único.
- **Firma electrónica** sobre el presupuesto/contrato.
- **Facturación:** convertir presupuesto aceptado en factura, cumplimiento fiscal formal por país.
- **Pagos:** integración con Stripe/PayPal/MercadoPago para anticipos.
- **Notificaciones automáticas:** recordatorios de seguimiento si el cliente no responde.
- **Analytics:** tasa de conversión, ingresos proyectados, servicios más rentables.
- **Multi-idioma** de la interfaz y de los documentos.
- **Exportación adicional:** Excel/CSV, envío de email integrado desde la app.
- **Monetización SaaS:** definición de planes/límites si se comercializa a otros estudios.
