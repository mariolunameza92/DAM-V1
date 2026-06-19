# DAM V1 — Resumen de alcance para el equipo de Amber

> **Propósito de este documento.** Dar al equipo que construirá la arquitectura real (Amber) el espectro completo de lo que es este demo: qué representa el producto, qué está realmente implementado, qué está *simulado para que la demo se vea realista*, y qué piezas clave del producto **todavía no están mapeadas** en este prototipo. La meta es que Amber no confunda "lo que se ve en la demo" con "lo que el producto necesita ser".

**Estado del repo:** prototipo/demo interactivo · rama `main` · sin backend · solo frontend.

---

## 1. ¿Qué es esto? (para alguien que nunca vio el DAM)

### 1.1 Qué es un DAM
Un **DAM (Digital Asset Management)** es una plataforma para **almacenar, organizar, buscar y distribuir archivos visuales** (fotos, videos) a escala. Piensa en un "Google Drive especializado en imágenes", pero con inteligencia: en lugar de buscar por nombre de archivo, buscas por **lo que hay dentro de la foto** (una persona, un objeto, una marca, un color).

### 1.2 Qué es LEN específicamente
**LEN** es una plataforma DAM **multi-tenant** (varios clientes/empresas aislados en la misma plataforma) **con IA**, enfocada inicialmente en **fotografía de eventos deportivos** (maratones, carreras, festivales). El caso de uso central:

1. Un fotógrafo cubre un evento (ej. *Lima 42K 2026*) → suben **miles de fotos**.
2. La IA detecta **rostros** y **dorsales** (números de corredor) en cada foto.
3. Se publica un **Portal público** del evento (ej. `len.pe/portal/lima-42k`).
4. Cada participante entra al portal, **sube una selfie** (o escribe su número de dorsal) → el sistema le devuelve **solo sus fotos** → las descarga.

Esto convierte un trabajo manual imposible (etiquetar 20,000 fotos a mano) en algo automático, y crea un canal de auto-servicio para los asistentes.

### 1.3 El espectro real de LEN (más allá del demo)
Según el documento maestro del producto, LEN es más amplio que esta demo. Tiene **múltiples aplicaciones / subversiones** sobre el mismo motor:
- **DAM B2B** — el caso de esta demo (agencias, eventos, marcas).
- **LEN for Schools** — fotografía escolar, donde el sujeto suele ser **menor de edad** → introduce **consentimiento crítico** (padre/apoderado, beneficiario) y cumplimiento legal estricto.
- **Marketplace / SaaS B2B** — otras verticales.

Esto importa para Amber porque la arquitectura no es "un DAM de eventos" — es **un motor multi-tenant con verticales encima**. La demo solo muestra una rebanada de una vertical.

---

## 2. Qué es técnicamente este repositorio

| Aspecto | Realidad |
|---|---|
| Tipo | **Prototipo de frontend puro**, sin backend, sin base de datos real |
| Stack | Vanilla HTML/CSS/JS · ES Modules nativos · **sin build tool** · GSAP (animación) |
| Persistencia | `sessionStorage` (se borra al cerrar pestaña — *a propósito*, para que cada demo arranque limpio) + IndexedDB (solo cache de imágenes demo) |
| Datos | **Todo hardcodeado** en `js/events-registry.js` y `js/data.js` |
| Servidor | Requiere servidor web local (no funciona desde `file://`) |
| Propósito | Demostrar el flujo completo a clientes de forma interactiva, **no** ser una base de producción |

**Implicación clave para Amber:** ningún dato de esta demo viene de un servidor. No hay autenticación, no hay API, no hay multi-tenancy real, no hay IA ejecutándose. Es una maqueta navegable de altísima fidelidad visual. La arquitectura real es prácticamente todo lo que **no** existe en este repo.

---

## 3. Mapa de features del demo (lo que SÍ está construido)

El demo se navega desde una sidebar con 7 secciones. Todas funcionan a nivel de UI:

| Sección | Qué hace en el demo | Archivo principal |
|---|---|---|
| **Inicio** | Dashboard de bienvenida: buscador semántico (UI), filtros (Face ID, marca, objeto, color, etc.), tiras de Face IDs favoritos/recientes, carpetas y archivos recientes | `js/features/inicio/inicio.js` |
| **Carpetas** | Explorador de archivos: árbol de carpetas + masonry de fotos, drill-down, subir archivos, crear carpetas, vista detalle de imagen con recorte/descarga | `js/features/carpetas/browser.js`, `upload.js` |
| **Face IDs** | Gestión de personas identificadas por rostro: lista de identificados / sin identificar, favoritos, crear/renombrar Face ID, conteo de apariciones | `js/features/faceids/faceids.js` |
| **Black List** | Lista negra de personas cuyo contenido se oculta en carpetas y portales (pero se sigue contabilizando) | `js/features/blacklist/blacklist.js` |
| **Portales** | El corazón comercial: wizard de 4 pasos para crear portales (unitario o "master"), tematización (logo, color, tipografía, light/dark), método de búsqueda (selfie/dorsal/ambos), control de acceso (público/clave), y el **portal público navegable** | `js/features/portales/modal.js`, `portal-screen.js`, `table.js` |
| **Analytics** | Dashboard de métricas con 2 pestañas (DAM / Portales): storage, crecimiento, actividad de usuarios, heatmaps, engagement de portales, seguridad | `js/features/analytics/analytics.js` |
| **Perfil** | Cuenta, plan/suscripción, facturación e historial de facturas | `js/features/perfil/perfil.js` |

### 3.1 El flujo estrella: el Portal público
La pieza más completa del demo. Un visitante (corredor) abre el portal del evento, sube su selfie o ingresa su dorsal, y obtiene sus fotos. Incluye lightbox, descarga individual, "descargar todo", tematización por cliente, drill-down por carpetas. Es el flujo que más se debe pulir porque es el que ve el **cliente final del cliente**.

---

## 4. Flujo REAL vs. ARTIFICIOS DE DEMO

Esta es la sección más importante para Amber. Distingue entre **funcionalidad que representa el producto real** y **trucos que existen solo para que la demo se vea viva** y que en producción se resuelven de forma completamente distinta.

### 4.1 Features que representan flujo real del producto
Estas SÍ deben existir en producción (la demo las modela conceptualmente bien):

- **Subida de fotos a carpetas** y organización en árbol.
- **Detección de rostros → Face IDs** como entidad de primera clase (persona reconocida que agrupa todas sus fotos).
- **Búsqueda por selfie y por dorsal** en el portal.
- **Creación y tematización de portales** (incluyendo portales "master" que agrupan varios portales unitarios).
- **Control de acceso a portales** (público vs. con contraseña).
- **Lista negra** (ocultar a personas que no consienten aparecer).
- **Analytics** de uso del DAM y de los portales.
- **Recorte y descarga** de assets.

### 4.2 Artificios de demo (simulados — NO son el flujo real)
Estos están *fingidos* para que la demo se vea realista. En producción se construyen de cero con backend/IA real:

| Artificio en el demo | Cómo está hecho | Cómo debe ser en producción |
|---|---|---|
| **"Reconocimiento facial"** | **No hay IA.** El match está pre-codificado en el *nombre del archivo* del selfie: `f7-1268-1270.png` significa "este rostro aparece en las fotos 1268 y 1270". `events-registry.js` deriva el mapa rostro→fotos de esos nombres | Pipeline real: detección facial (ej. Rekognition/Roboflow), **embeddings biométricos**, búsqueda vectorial (pgvector), umbral de similitud |
| **Búsqueda por selfie en el portal** | La selfie subida **no se procesa**; se hace match contra los Face IDs pre-etiquetados | Subir selfie → extraer embedding → buscar coincidencias por similitud vectorial en tiempo real |
| **Búsqueda semántica del Inicio** ("buscar por objeto, color, escena, logo") | UI con sugerencias, sin motor detrás | Indexación visual real (tags por IA, búsqueda por texto/embedding multimodal, ej. Elasticsearch) |
| **Analytics** | ~90% **datos estáticos** (objeto `M` en `analytics.js`). Solo el conteo de Face IDs y archivos totales se deriva de datos en sesión | Métricas reales agregadas desde eventos/logs |
| **Plan, facturación, facturas** | Todo hardcodeado; los botones disparan toasts ("Próximamente...") | Integración de pagos real, generación de facturas, gestión de suscripción |
| **Descargas y "compartir"** | Mayormente toasts; las descargas reales dependen de URLs locales de demo | **API de descarga real** con URLs firmadas (ya identificado como pendiente de producción) |
| **Persistencia** | `sessionStorage` — se borra al cerrar pestaña | Base de datos multi-tenant, persistente |
| **Usuario / login** | No hay login. Usuario fijo "Mario Luna / Administrador" hardcodeado | Autenticación, sesiones, roles |
| **Storage "240GB de 500GB"** | Número fijo en el HTML | Cálculo real de cuota por tenant |

> **Regla mental para Amber:** todo lo que parezca "inteligente" o "conectado" en la demo (IA, búsqueda, métricas, pagos, descargas, almacenamiento) está simulado. Lo que es genuino es la **estructura de la experiencia y el modelo de dominio** (carpetas, Face IDs, portales, lista negra).

---

## 5. Features clave que FALTAN mapear en este demo

El demo muestra **una sola perspectiva: la del usuario operador de un tenant** (el "Mario Luna / Administrador" que sube fotos y crea portales). Faltan vistas y flujos enteros del producto que el cliente real necesitará. Estos son los huecos que Amber debe tener en su radar:

### 5.1 Vista de administración de plataforma / cuentas (el ejemplo que diste)
- **Panel de super-admin / admin de plataforma** (LEN como operador del SaaS): gestión de todos los tenants, no existe en el demo.
- **Gestión de cuentas y miembros del equipo dentro de un tenant**: invitar usuarios, asignar roles.
- **Gestión de permisos y roles** (RBAC): qué puede ver/hacer cada rol (admin, editor, fotógrafo, invitado). El demo asume que todos son "Administrador".
- **Vista de usuario no-admin / invitado**: el demo nunca muestra cómo se ve la app con permisos limitados.

### 5.2 Multi-tenancy (la columna vertebral ausente)
- **Aislamiento entre tenants** (subversiones): el demo es mono-tenant. Toda la arquitectura de separación de datos, blacklists por tenant, branding por tenant, etc., no está representada.
- **Onboarding de un nuevo tenant / cliente.**

### 5.3 Autenticación y seguridad
- Login, recuperación de contraseña, 2FA, sesiones, logout. El demo no tiene puerta de entrada.
- **Audit log** (registro de auditoría) — quién hizo qué y cuándo. Crítico para cumplimiento.

### 5.4 Consentimiento y cumplimiento legal (crítico, sobre todo para LEN for Schools)
- **Gestión de consentimiento** (`ConsentRecord`): registro de quién consintió aparecer/ser fotografiado. En el caso escolar implica **padre/apoderado y beneficiario (menor)**.
- **Flujos ARCO** (Acceso, Rectificación, Cancelación, Oposición) y solicitudes de baja de datos.
- **Cumplimiento normativo**: Ley 29733 (Perú), Ley 21.719 (Chile), GDPR, DPA. La lista negra del demo es el embrión visual de esto, pero el aparato legal completo no está modelado.
- Tratamiento especial de **PII y embeddings biométricos** (un embedding facial es dato biométrico sensible).

### 5.5 Pipeline real de IA / procesamiento
- Estado de **procesamiento de un lote de fotos** (subiendo → detectando rostros → indexando → listo). El demo muestra fotos ya procesadas; no muestra el "mientras tanto".
- **Cola de revisión** de rostros sin identificar, merge de duplicados, corrección de falsos positivos.

### 5.6 Notificaciones y comunicación
- Notificaciones (in-app, email): "tu portal recibió X visitas", "fotos listas", "alguien solicitó baja".
- Comunicación con el visitante del portal (ej. avisar al corredor que sus fotos están listas).

### 5.7 Ciclo de vida y operaciones
- **Expiración / archivado de portales** (el analytics los menciona, pero no hay flujo de gestión).
- **Papelera / borrado** real con retención.
- **Versionado** de assets.

---

## 6. Features que podrían salir más adelante (roadmap probable)

Cosas que no son huecos urgentes pero que la arquitectura debería **no cerrarse a** desde el día uno:

- **Verticales adicionales** sobre el mismo motor (LEN for Schools con su modelo de consentimiento, Marketplace, otras SaaS B2B).
- **Búsqueda semántica multimodal real** (por escena, objeto, logo de marca, color) — hoy es solo UI.
- **Marca / co-branding profundo de portales** (dominios propios, white-label completo).
- **Monetización de portales** (cobro por descarga de fotos al asistente — pasarela de pago en el portal público).
- **API pública / integraciones** (el plan Pro ya promete "Acceso a API").
- **Detección de objetos/marcas** para sponsors (valor publicitario: "tu logo apareció en N fotos").
- **App móvil** del portal / captura.
- **Analytics avanzado y exportable** con datos reales y segmentación por tenant.
- **Roles y permisos granulares** más allá de RBAC básico (permisos por carpeta, por portal).
- **Flujos de aprobación** (un fotógrafo sube, un editor aprueba antes de publicar).

---

## 7. Recomendaciones de arquitectura para Amber

Resumen ejecutivo de lo que la demo *implica* pero no construye:

1. **Backend multi-tenant primero.** La demo es mono-usuario/mono-tenant. El aislamiento de datos por tenant es la decisión más cara de postergar — debe estar en los cimientos (no es retrofitteable barato).
2. **El reconocimiento facial es el producto, y no existe aquí.** Todo el match es un truco de nombres de archivo. El pipeline de IA (detección → embeddings biométricos → búsqueda vectorial) es trabajo nuevo de extremo a extremo y probablemente el de mayor riesgo técnico.
3. **El consentimiento y el cumplimiento legal no son "una feature más"** — son requisito legal (datos biométricos de personas, potencialmente menores). Modelar `ConsentRecord`, blacklist por tenant y audit log temprano.
4. **Autenticación, roles y panel de administración** son vistas enteras que el demo no muestra. Planificar el modelo de permisos antes de construir UI.
5. **El frontend del demo es referencia de UX/diseño, no de arquitectura.** Es vanilla JS sin build, con estado en `sessionStorage`. El equipo decidirá su propio stack de frontend; este repo sirve como **spec visual e interactivo de alta fidelidad**, no como código base.
6. **Lo genuinamente valioso a heredar:** el modelo de dominio (carpetas, Face IDs como entidad, portales unit/master, lista negra) y los flujos de UX ya validados con clientes.

---

### Apéndice — Mapa rápido de archivos del demo

| Para entender... | Mirar |
|---|---|
| Datos demo de eventos, rostros y mapa rostro→foto (el "truco" de IA) | `js/events-registry.js` |
| Estructura de carpetas | `js/data.js` |
| Estado de sesión / persistencia | `js/session.js` |
| Store de Face IDs (favoritos, renombrados, etc.) | `js/faces.js` |
| Decisiones de arquitectura del demo (por qué está así) | `DAM-BUILD-DECISIONS.md` |
| Routing e init global | `js/main.js` |
| Contexto e instrucciones del proyecto | `CLAUDE.md` |
