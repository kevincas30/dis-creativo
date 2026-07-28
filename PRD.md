# PRD — Presupuestador Inteligente KEVS

**Versión:** 1.0 (MVP)
**Fecha:** 2026-07-27
**Producto:** Aplicación web para generar presupuestos profesionales para el estudio de diseño KEVS (webs, diseño de redes/gráfico, fotografía), con asistencia de IA para calcular y explicar precios.
**Visión a largo plazo:** Evolucionar hacia un SaaS multi-tenant vendible a otros estudios de diseño. El MVP se construye para un solo estudio y un solo usuario, pero las decisiones de datos y arquitectura deben evitar bloquear esa evolución (ver sección 11).

---

## 1. Resumen del problema

Kevs actualmente cotiza "a ojo": consulta precios de referencia o pregunta a una IA cada vez, sin una tarifa horaria ni un sistema formal de cálculo. Esto genera inconsistencia entre presupuestos, pérdida de tiempo, y documentos poco profesionales para enviar a clientes. La app debe convertir ese proceso informal en un flujo guiado, consistente y que además "venda" el servicio, no solo liste un precio.

## 2. Usuarios objetivo (MVP)

- **Usuario único (Admin/Owner):** Kevs. Crea servicios, define reglas de precio, gestiona clientes y genera presupuestos.
- **Futuro cercano (post-MVP, no bloqueante):** 2 usuarios adicionales del estudio, con posibles roles distintos (ej. alguien que solo crea presupuestos vs. quien administra precios). El modelo de datos de usuarios se diseña desde el MVP para soportar esto sin refactor mayor, aunque la UI de gestión de roles no se construya todavía.

## 3. Servicios del estudio (catálogo inicial)

El catálogo de servicios debe ser **configurable por el usuario** (no hardcodeado), porque los precios y ofertas cambiarán con el tiempo. Datos de referencia inicial provistos por Kevs:

| Categoría | Servicio | Precio de referencia | Notas |
|---|---|---|---|
| Webs | Página básica | 350–450 EUR | Aumenta según dificultad hasta 1000–1500 EUR |
| Diseño de redes | Carrusel | ~450 MXN | |
| Diseño de redes | Post normal | ~250 MXN | |
| Fotografía | — | Sin definir | El usuario debe poder crear el servicio y dejar el precio pendiente hasta configurarlo |

**Requisito:** la pantalla de gestión de servicios debe permitir crear, editar y desactivar servicios y sus reglas de precio en cualquier momento, sin intervención de desarrollo.

## 4. Motor de cálculo de precios

### 4.1 Comportamiento esperado
- La app **calcula el precio**, no solo lo registra manualmente.
- Junto al total, la app debe **explicar en lenguaje claro qué factores usó y cómo llegó a ese número** (ej. "Base: página básica 400€ + complejidad media (+150€) + 2 páginas extra (+100€) = 650€").
- Debe soportar **descuentos** (porcentaje o monto fijo), aplicables a nivel de línea o de presupuesto completo, con un campo de motivo/nota opcional (ej. "cliente recurrente", "pago anticipado").

### 4.2 Estructura de cálculo por servicio
Cada servicio tiene un **cuestionario de configuración** que alimenta el cálculo (ver sección 6). Ejemplos de factores:
- Webs: número de páginas, complejidad/funcionalidades, urgencia.
- Diseño de redes: tipo de pieza (post/carrusel/reel), cantidad, revisiones incluidas.
- Fotografía: a definir cuando el usuario configure el servicio.

### 4.3 Transparencia del cálculo
El desglose explicativo debe:
- Mostrarse en la app durante la edición del presupuesto (para que Kevs pueda ajustar antes de enviar).
- Poder incluirse o no en el PDF final al cliente (por defecto, al cliente se le muestra el desglose de servicio, no la lógica interna de cálculo del precio).

## 5. Monedas e impuestos

- **Monedas soportadas en el MVP:** MXN (México) y EUR (España).
- **Impuestos por defecto:** IVA 16% en México, IVA 21% en España. Configurables por si cambian.
- **Regla clave (no es conversión de divisa):** cuando Kevs elige la moneda de un presupuesto, la app **no convierte** el precio de una moneda a otra con tipo de cambio. En su lugar, cada servicio tiene **precios de referencia propios por mercado/moneda** (un catálogo de precios para MXN y otro para EUR), y la IA debe **investigar rangos de mercado actuales** para sugerir/actualizar esos precios de referencia (ver sección 10).
- Esto implica que el modelo de datos de "precio de servicio" está **segmentado por moneda/mercado**, no es un único número convertido.

## 6. Clientes

- Los clientes se guardan como **registros persistentes ("tickets")**: nombre, empresa (opcional), email, teléfono, país/moneda habitual, notas.
- Al crear un presupuesto, se busca un cliente existente o se crea uno nuevo.
- Cada cliente debe mostrar su **historial de presupuestos** asociados (para detectar clientes recurrentes y aplicar condiciones especiales si aplica).

## 7. Flujo de creación de presupuesto (MVP)

1. Kevs entra a "Nuevo presupuesto" y **selecciona el servicio** (web, diseño de redes, fotografía).
2. La app despliega un **cuestionario guiado específico del servicio** (preguntas que alimentan el cálculo: alcance, complejidad, cantidad, plazos, etc.).
3. Al completar el cuestionario, la app **genera automáticamente el presupuesto**: desglose de líneas, explicación del cálculo, y total.
4. Kevs puede **editar manualmente** cualquier línea, precio, descuento o texto antes de finalizar.
5. Selecciona/crea el **cliente** y la **moneda** del presupuesto.
6. Al presionar **"Imprimir/Generar PDF"**, se produce un documento final listo para enviar, que incluye:
   - Logo y marca de KEVS.
   - Datos del cliente.
   - Descripción del servicio en tono **persuasivo/comercial** (no solo el precio: se explica el valor, no solo se lista).
   - Desglose detallado del servicio y precio total.
   - Condiciones comerciales (ver sección 8).

## 8. Contenido del documento de presupuesto

El PDF final debe incluir, además del precio:
- **Descripción de venta del servicio** (copy persuasivo, no solo técnico).
- **Desglose detallado** de lo incluido.
- **Términos y condiciones** (forma de pago, política de revisiones, etc.).
- **Tiempos de entrega**.
- **Oferta/descuento aplicado**, si corresponde.
- **Fecha de emisión** y **validez de la propuesta** (fecha de expiración).

El texto de condiciones es una **plantilla base fija, pero con secciones condicionales** que cambian según el servicio elegido y las respuestas del cuestionario (ej. tiempos de entrega distintos para web vs. fotografía).

## 9. Exportación

- **MVP: solo PDF.** Diseño de plantilla fija con la identidad de marca de KEVS (logo, colores).
- No se requiere envío de email automático, integración de firma ni portal de cliente en esta fase (queda en backlog, sección 12).

## 10. Inteligencia artificial (alcance MVP)

Dos capacidades concretas para el MVP:

1. **Generación del desglose:** a partir de las respuestas del cuestionario guiado, la IA arma automáticamente las líneas del presupuesto (servicio, cantidad, justificación) y redacta la explicación del cálculo y la descripción de venta del servicio.
2. **Sugerencia de precio basada en mercado actual:** la IA debe **buscar información actualizada** (vía búsqueda web) sobre rangos de precio de mercado para el servicio + moneda/región seleccionados, y proponer un precio o rango, en lugar de usar un valor fijo desactualizado o una conversión de divisa. Esto alimenta y mantiene actualizado el catálogo de precios por mercado descrito en la sección 5.

**Nota de factibilidad:** este segundo punto requiere que el sistema tenga capacidad de búsqueda web en tiempo real (no solo generación de texto). Es una dependencia técnica real a validar en la fase de arquitectura, y los resultados deben tratarse como **sugerencia editable**, nunca como precio final automático — Kevs siempre revisa y confirma antes de enviar.

## 11. Historial y estados del presupuesto

- **Estados:** Borrador, Enviado, Aceptado, Rechazado.
- **Funcionalidades del listado de historial:**
  - Buscar/filtrar por cliente, estado, fecha, servicio.
  - Ver detalle de cualquier presupuesto pasado.
  - **Duplicar** un presupuesto existente como punto de partida para uno nuevo.

## 12. Usuarios y autenticación (MVP)

- Un solo usuario (Kevs) con login simple (email/contraseña).
- El modelo de datos de "Usuario" se diseña pensando en soportar **múltiples usuarios y roles en el futuro cercano** (ya mencionaste que quieres agregar 2 personas), pero la UI de invitar/gestionar usuarios y permisos **no es parte del MVP**.

## 13. Fuera de alcance del MVP (backlog para fases futuras)

Explícitamente diferido, no se construye ahora:
- Multi-tenant real (otros estudios usando la app con sus propios datos aislados) — arquitectura SaaS completa.
- Portal de cliente (aprobar/comentar presupuesto online).
- Firma electrónica.
- Conversión de presupuesto aceptado en factura / facturación electrónica formal.
- Integraciones de pago (Stripe, PayPal, MercadoPago) para cobrar anticipos.
- Notificaciones automáticas (recordatorios de seguimiento).
- Reportes/analytics de conversión e ingresos.
- Soporte multi-idioma.
- Gestión de roles y permisos granular multi-usuario.
- Exportación a otros formatos (Excel/CSV) o envío de email integrado.

## 14. Requisitos no funcionales

- **Seguridad de datos:** los presupuestos contienen precios y datos de clientes; acceso protegido por autenticación desde el día uno.
- **Portabilidad de datos:** aunque el MVP es single-user, evitar decisiones que hagan imposible exportar/migrar los datos después (relevante para la futura visión SaaS).
- **Rendimiento:** generación de presupuesto (incluida consulta de IA) en tiempo razonable para uso interactivo (objetivo: bajo ~10-15 segundos incluyendo la búsqueda de mercado).
- **Consistencia de marca:** el PDF exportado debe verse profesional y reflejar la identidad visual de KEVS.

## 15. Supuestos y puntos abiertos a resolver durante el desarrollo

- Tarifa horaria y precios de fotografía **aún no definidos** por Kevs — la app debe permitir dejarlos configurables/pendientes sin bloquear el uso de otros servicios.
- Necesario definir/recibir: logo y colores de marca de KEVS, texto legal base de términos y condiciones.
- La fiabilidad y fuente de la "búsqueda de precios de mercado actuales" (sección 10) se validará técnicamente antes de comprometerse a un proveedor específico.
- Estructura exacta de las preguntas del cuestionario por servicio se refinará en la fase de diseño de cada flujo (fase 2 del roadmap).

## 16. Propuesta técnica preliminar (a confirmar antes de codear)

Recomendación inicial, sujeta a tu validación antes de iniciar desarrollo:
- **Frontend/backend:** Next.js + TypeScript (full-stack, permite server actions y facilita evolucionar a SaaS después).
- **Base de datos:** PostgreSQL (ej. vía Supabase o Neon) — relacional, adecuado para el modelo de clientes/servicios/presupuestos y con buen camino hacia multi-tenant futuro.
- **Generación de PDF:** librería tipo `react-pdf` o renderizado headless (Puppeteer) desde una plantilla HTML/CSS de marca.
- **IA:** modelos Claude vía API, con capacidad de búsqueda web habilitada para la sugerencia de precios de mercado.
- **Autenticación:** solución gestionada simple (ej. NextAuth/Auth.js) para no reinventar seguridad, con modelo de datos listo para multi-usuario futuro.
- **Hosting:** Vercel (frontend/backend) + proveedor Postgres gestionado.

*(Esta sección es una recomendación de arquitectura, no una decisión cerrada — la confirmamos antes de escribir código.)*
