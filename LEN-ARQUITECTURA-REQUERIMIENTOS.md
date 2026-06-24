# LEN — Desglose de producto y requerimientos de arquitectura

> **Para:** equipo de arquitectura (Amber).
> **De:** equipo de producto/demo LEN.
> **Objetivo:** entregar el espectro completo de producto, flujos, casuísticas, criterios de funcionamiento y lineamientos necesarios para diseñar la arquitectura **bien a la primera, sin reprocesos**.
> **Base documental:** Documento Maestro LEN v1.0 (Abril 2026) + prototipo interactivo (este repo, rama `main`).
> **Fecha:** Junio 2026.

---

## 0. Cómo usar este documento

- Este documento es la **fuente de requerimientos**. El prototipo (`index.html` + `js/`) es la **fuente de UX/UI**, no de arquitectura. Ver el complemento [DAM-DEMO-SCOPE-PARA-AMBER.md](DAM-DEMO-SCOPE-PARA-AMBER.md) para distinguir qué del demo es flujo real vs. simulado.
- Lo que está **fundamentado en el Documento Maestro** se marca como tal. Lo que es **recomendación del equipo** (no decisión cerrada de LEN) se marca con 🔵 **[Recomendación]** para que Amber lo valide, no lo asuma.
- Las **decisiones técnicas finales de arquitectura** (BD, orquestación, fronteras de servicio) las cierra **Ángel**. Este documento marca dirección y restricciones, no diseño definitivo.
- ⚠️ **Nota de terminología:** en el Documento Maestro, *"Amber"* es el nombre del **proyecto de esqueleto de microservicio** (template + CLI, mencionado por Williams). Si "el equipo de Amber" se refiere a otro grupo, conviene desambiguar el nombre internamente para evitar confusión en tickets y repos.

---

## 1. Desglose de producto: qué es LEN

### 1.1 En una línea
LEN es una **plataforma de visión computacional multi-tenant** sobre la cual se despliegan **aplicaciones nichadas** por vertical (educación, hospitality, deportes, festivales, corporativo, retail). **Lo que se vende es la plataforma; las imágenes son solo el canal de captura.**

> Implicación nº1 para Amber: no estás construyendo "un software de fotos de eventos". Estás construyendo **infraestructura reutilizable**. Cada decisión se evalúa contra: *¿esto sirve a todos los verticales o solo a uno?*

### 1.2 Las cuatro capas (modelo mental del producto)

| Capa | Qué es | Estado |
|---|---|---|
| **1 — Captura** | Entrada de imágenes (hoy foto profesional de eventos; futuro: cámaras, IoT, UGC, video) | Operativo |
| **2 — Procesamiento (IA)** | Reconocimiento facial, detección de objetos/logos, OCR, segmentación, clustering | Maduro (AWS Rekognition, 94% precisión) |
| **3 — Plataforma (el DAM)** | Usuarios, tenants, autorización, consentimientos, blacklist, álbumes, búsqueda, distribución, auditoría | **En formalización ← aquí trabaja Amber** |
| **4 — Aplicaciones** | Productos comerciales: LEN for Schools, DAM B2B, DAM-API | Schools en MVP; B2B en casos puntuales |

### 1.3 "Plataforma modular multi-tenant para múltiples aplicaciones"

- **Plataforma:** infraestructura compartida, no una app. Sus capacidades son reutilizables entre mercados.
- **Modular:** las capacidades son módulos que se **activan/desactivan por tenant** (`Tenant.enabled_modules`). Schools activa Consentimientos + Blacklist + Cuentas anidadas + Distribución privada. Punta Cana activa DAM Search + Logo Detection + Reportes de marca.
- **Multi-tenant:** múltiples clientes sobre la misma infraestructura, **datos completamente aislados**. Ningún query autenticado en un tenant puede traer datos de otro.
- **Para múltiples aplicaciones:** cada aplicación = una **configuración** del DAM (subversión `schools` / `dam_b2b` / `dam_full`), con su propia UX, marca y modelo comercial.

### 1.4 Las aplicaciones (verticales)

| Aplicación | Estado | Vertical | Ancla |
|---|---|---|---|
| **LEN for Schools** | MVP en construcción (lanzamiento jul 2026) | Educación | Alpamayo + 3-4 más |
| **DAM B2B** | Casos en producción | Hospitality, deportes, festivales, corporativo | Punta Cana, FPF, Lotus, Nevermind |
| **DAM como API licenciable** | Conceptual (diseñar ahora, activar después) | Tecnológico (trade marketing retail, ej. Eficacia) | Pendiente |

### 1.5 La regla operativa más importante (lineamiento maestro)

> **Antes de escribir cualquier código o diseño, pregúntate: ¿esto vive solo en una aplicación (ej. Schools), o vive en la plataforma común que sirve a todos los verticales?**
>
> Si la lógica *podría* aplicar a otros verticales pero la estás escribiendo "solo para colegios" → **refactorizá para que viva en la plataforma común.** Solo lo genuinamente específico de la vertical (cuentas anidadas padre→hijo, calendario escolar peruano) va en la capa de aplicación.

---

## 2. Del prototipo al producto: mapa de correspondencia

Esto conecta lo que Amber verá en el demo con los módulos y servicios reales. **El demo sigue siendo mono-tenant, mono-usuario y sin IA real** (el match facial está pre-codificado en nombres de archivo; ver doc complementario), **pero su modelo de dominio ya convergió fuerte con el producto real**: el prototipo ahora incluye Consentimientos versionados, consent por persona con auto-blacklist, Grupos, y una **Configuración con módulos habilitables + roles de equipo + pricing**. Equivalencias actualizadas:

| Lo que se ve en el demo | Concepto de producto | Microservicio(s) objetivo | Estado en demo |
|---|---|---|---|
| Carpetas / árbol / masonry | Álbumes + Fotos | Content Service | UX |
| Subir archivos | Ingesta + pipeline async de procesamiento | Content + Face Recognition + File Storage | UX (sin pipeline real) |
| "Face IDs" (personas) | DetectedFace + Beneficiary + embeddings | Face Recognition + Identity | UX (match simulado) |
| Búsqueda por selfie/dorsal en portal | Match facial / OCR contra índice | Face Recognition + OCR + DAM Search | UX (simulado) |
| Búsqueda global ⌘K | Search cross-dominio | DAM Search | UX (filtro local) |
| **Consentimientos** (plantillas, versionado, módulos visual/rrss/comms/ia, estados) | ConsentTemplate + ConsentModule | **Consent Service** | ✅ **modelado** (sin PDF/firma real) |
| **Consent por persona** (signed/pending + revocar → auto-blacklist) | ConsentRecord + propagación UC-03 | Consent + Blacklist | ✅ **modelado** (propaga a blacklist, no a fotos) |
| Black List (con `source`: manual / consent_revoked) | BlacklistEntry + propagación | Blacklist Service | ✅ modelado (sin embeddings) |
| **Grupos** (equipos/secciones de personas) | Agrupación de Beneficiary (`metadata`: grade/section) | Identity / Content | ✅ modelado |
| Portales (unit/master, tema, acceso) | Distribución con branding + control de acceso | Content + File Storage (signed URLs) + Authorization | UX |
| **Configuración → Módulos** (toggles que muestran/ocultan secciones) | `Tenant.enabled_modules` (modularidad real) | Identity / Authorization | ✅ **modelado** (reactiva el sidebar) |
| **Configuración → Equipo y roles** (Admin/Editor/Viewer, invitar, cambiar rol) | RBAC | Authorization | ✅ modelado (RBAC simple, sin scope) |
| **Configuración → Pricing** (Starter/Pro/Enterprise = bundles de módulos) | Planes ↔ módulos habilitados | Billing | ✅ modelado (estático) |
| Analytics | Reporting / brand exposure | Reporting Service | UX (mayormente estático) |
| Perfil / plan / facturación | Billing + suscripción + cuenta | Identity + (billing externo: Stripe/Niubiz) | UX (mock) |
| (No existe en el demo) | **Auditoría inmutable** | **Audit Service** | ❌ falta |
| (No existe en el demo) | **Multi-tenancy / aislamiento** | Transversal a todos | ❌ falta |
| (No existe en el demo) | **Cuentas anidadas padre→hijo** (Schools) | Identity (Beneficiary.primary_user_ids) | ❌ falta |
| (No existe en el demo) | **Autenticación / login / MFA** | Identity | ❌ falta |

> **Lo que el demo ya valida (modelado, aunque simulado):** el dominio de **Consentimientos versionados**, la **propagación consent→blacklist (UC-03)**, la **modularidad por `enabled_modules`** y el **RBAC básico**. Esto es excelente insumo de UX y de modelo de dominio para Amber.
>
> **Lo que sigue faltando y es lo más crítico/bloqueante:** **multi-tenancy y aislamiento**, **autenticación**, **Audit log inmutable**, el **pipeline real de IA**, la **firma/PDF de consentimientos**, la **propagación retroactiva del consent a las fotos publicadas** (hoy solo crea la entrada de blacklist) y las **cuentas anidadas padre→hijo** de Schools.

---

## 3. Actores y roles

Roles del sistema (de `User.user_type` y stakeholders de Schools). El RBAC debe contemplar al menos:

| Rol | Vertical | Capacidades clave |
|---|---|---|
| `len_admin` | LEN (plataforma) | Administración global, onboarding de tenants. **Zero-access al contenido del tenant.** |
| `len_support` | LEN (Customer Success) | Soporte/onboarding, sin acceso a contenido sensible. |
| `admin_tenant` | Todas | Sube fotos, crea álbumes, gestiona blacklist manual, configura el tenant. |
| **Aprobador** | Schools (B2B opcional) | Aprueba publicación de álbumes antes de hacerlos visibles. |
| **Owner del colegio/empresa** | Todas | Cuenta institucional, permisos máximos del tenant. |
| `parent` (Padre/Apoderado) | Schools | Titular de cuenta, da consentimientos, accede al contenido de sus hijos. Cuenta anidada padre→hijos. |
| Alumno / Beneficiary | Schools | Beneficiario del contenido. **En MVP no tiene login.** |
| `sponsor` / `press` | B2B | Acceso a portales/álbumes específicos (portal de prensa, marca). |
| `visitor` | B2C | Asistente a evento que busca sus fotos (corredor, etc.). |

> **Estado en demo:** Configuración ya incluye un equipo con roles **Admin / Editor / Viewer** (invitar, cambiar rol, eliminar). Es un RBAC de un solo eje (rol global del tenant). **Falta el segundo eje** y los roles legales/operativos de arriba (`len_admin` zero-access, Aprobador, Owner, `parent`, `sponsor`/`press`, `visitor`).
>
> 🔵 **[Recomendación]** Modelar permisos en dos ejes simultáneos: **rol** (qué acciones) **× scope de contenido** (sobre qué álbumes/beneficiarios). Nunca autorizar solo por rol (ver regla nº2 de compliance, §10). El RBAC del demo (Admin/Editor/Viewer) es el punto de partida de UX, no el modelo final.

---

## 4. Módulos de la plataforma (microservicios objetivo)

Dirección preliminar (decisión final de Ángel). Separación por dominio funcional, multi-tenant por diseño, comunicación mayormente asíncrona/event-driven.

| Microservicio | Dominio | Crítico para | Prioridad |
|---|---|---|---|
| **Identity Service** | Usuarios, tenants, sesiones, beneficiarios | Todas | Alta — base |
| **Authorization Service** | Roles, permisos, RBAC | Todas | Alta — base |
| **Consent Service** | Plantillas, consentimientos, módulos, PDF firmado | Schools (crítico), festivales B2B | Alta — **bloqueante** |
| **Blacklist Service** | Entradas + embeddings de personas restringidas | Schools (crítico), Lotus VIP | Alta — **bloqueante** |
| **Content Service** | Álbumes, fotos, faces, logos (refactor del core) | Todas | Alta |
| **Face Recognition Service** | Embeddings, matching (wrap Rekognition) | Todas | Existe |
| **OCR Service** | Texto/dorsales detectados | Running, FPF | Existe |
| **Logo Detection Service** | Modelos custom, embeddings de logos | FPF, Lotus | Media |
| **DAM Search Service** | Búsqueda multi-filtro, indexación (Elasticsearch) | Punta Cana | Media |
| **Audit Service** | Logs inmutables append-only | Todas | Alta — transversal |
| **Notification Service** | Email, SMS, in-app | Todas | Media |
| **File Storage Service** | Wrapper S3, signed URLs | Todas | Existe |
| **PDF Generation Service** | Consentimientos firmados, reportes | Schools, B2B | Media |
| **Reporting Service** | Brand exposure, analytics | B2B (futuro) | Baja |

**Construcción este año (6-9 meses):** microservicios críticos = **Identity, Consent, Blacklist, Authorization, Audit**. Esto desbloquea Schools y prepara el DAM completo.

**Estrategia de migración:** **incremental, no big-bang.** Coexistencia Strapi (legacy) ↔ microservicios nuevos durante meses. Consent y Blacklist se construyen **como microservicios externos desde el inicio**, conectados a Strapi vía API.

---

## 5. Modelo de datos (entidades núcleo)

Preliminar (cierra Ángel). Resumen de las entidades que estructuran todo lo demás:

- **Identidad:** `User` (con `tenant_id`, `user_type`, `status`), `Beneficiary` (apoderados `primary_user_ids[]`, `face_embedding_id`), `Tenant` (`subversion`, `enabled_modules[]`, `branding`, `consent_template_id`, `data_retention_policy`).
- **Autorización/consentimiento:** `ConsentTemplate` (versionada, una activa por tenant), `ConsentModule` (`scope_channels[]`, `is_critical`), `ConsentRecord` (**inmutable**, `module_decisions`, `signed_pdf_url`, `is_current`, `revoked_at`), `BlacklistEntry` (`entry_type`, `face_embedding` vector, `scope` JSON, `active`).
- **Contenido:** `Album` (`privacy_level`, `scope_users[]`, `approved_by`), `Photo` (`processing_status`, `publication_status`, `review_flags[]`, `blacklist_match_ids[]`, `is_safe_for_external`), `DetectedFace` (`embedding` vector, `matched_blacklist_id`, `bounding_box`), `DetectedLogo`, `detected_text`.
- **Auditoría:** `AuditLog` (**append-only, inmutable, retención ≥ 24 meses**).

> **Invariantes que el modelo debe garantizar:**
> - Todo registro con datos de personas lleva `tenant_id` y **toda query lo filtra**.
> - `ConsentRecord` nunca se sobrescribe: revocar = nueva versión + `revoked_at` en la anterior.
> - El `face_embedding` es **dato biométrico**: mismo nivel de protección que la imagen.
> - `Photo.publication_status` es una máquina de estados (ver §6/§8), no un booleano.

---

## 6. Flujos de trabajo críticos

Los flujos que **generan la mayor complejidad arquitectónica**. (Detalle paso a paso en el Documento Maestro UC-01 a UC-05.)

### UC-01 — Consentimiento informado por hijo (Schools)
Padre ingresa → sistema verifica consentimientos vigentes contra plantilla activa → si falta alguno, **bloquea el acceso** y muestra modal → padre autoriza/rechaza módulos por hijo y **firma digital** → se genera **PDF inmutable** en S3 → se actualiza tabla de consentimientos vigentes → **si rechaza un módulo crítico, el alumno entra automáticamente a la blacklist** con el scope correspondiente.

### UC-02 — Detección de contenido restringido al subir fotos (optimizado por costo)
Admin sube N fotos → estado `processing` → por foto se detectan rostros y se generan embeddings → **match SOLO contra la blacklist activa del tenant** (no contra todo el padrón) → sin match = `approved`; con match = `pending_review` + banderita roja + registro de qué entrada disparó → embeddings se guardan en `DetectedFace` para otras consultas (búsqueda por selfie), no para autorizar aquí.

> **Por qué es clave:** comparar contra blacklist (~30 entradas) vs. padrón completo (~1500 alumnos) es ~50× más barato. La lógica está **invertida**: "rostro no en blacklist = autorizado". Esto exige que **toda revocación de consentimiento se propague a la blacklist en milisegundos** (ver UC-03). Es la restricción más sutil y peligrosa del sistema: una propagación lenta = foto publicada sin consentimiento.

### UC-03 — Padre revoca consentimiento ya otorgado
Padre desmarca módulo → confirma → **nuevo PDF versionado** (el anterior se archiva) → actualiza consentimientos vigentes → **agrega/actualiza blacklist de forma síncrona o quasi-síncrona** → dispara proceso **retroactivo**: identifica todas las fotos publicadas donde aparece el hijo en ese canal → pasan a `hidden_by_consent_revocation` → si la foto ya está en un canal externo (Instagram del colegio), **notifica al admin para acción manual** (no se puede despublicar de Instagram automáticamente) → todo queda en audit log.

### UC-04 — Admin agrega persona externa a blacklist
(Ej. padrastro en Día del Padre que no firma.) Admin crea entrada manual (nombre opcional, foto, **scope**: todos los álbumes / futuros desde fecha X / un evento) → sistema extrae embedding → crea `BlacklistEntry` tipo `manual_external` → **reprocesa álbumes existentes dentro del scope** buscando match → fotos con match → `pending_review` → admin recibe resumen de afectados.

### UC-05 — Búsqueda DAM multi-filtro (Punta Cana, B2B)
Admin combina filtros (persona + rango de fechas + evento + logo) → query compuesto **ordenado por selectividad** (primero evento+fecha, luego intersección con embeddings de la persona, luego con fotos donde se detectó el logo) → resultado paginado → filtros adicionales **in-memory sin re-query** → exportación masiva en zip → operación auditada.

### Flujo B2C de eventos (el que muestra el prototipo)
Fotógrafo cubre evento → admin sube fotos → pipeline IA detecta rostros/dorsales → admin crea **Portal** (unit o master) con branding, método de búsqueda (selfie/dorsal/ambos) y acceso (público/clave) → publica `len.pe/portal/...` → **visitante** sube selfie o ingresa dorsal → recibe **solo sus fotos** → descarga (individual o "todo").

### Onboarding de tenant (no está en el demo — flujo nuevo)
🔵 **[Recomendación]** Crear tenant → elegir `subversion` y `enabled_modules` → cargar branding → (Schools) cargar padrón de beneficiarios + plantilla de consentimientos → invitar usuarios admin → estado `active`. Es el flujo que habilita la **Apuesta 5** (expansión geográfica con self-onboarding).

---

## 7. Casuísticas y edge cases (lo que rompe diseños ingenuos)

Estos casos deben estar resueltos en el diseño, no descubiertos en producción:

**Consentimiento / blacklist**
- Revocación de consentimiento **mientras un lote se está procesando** (carrera entre UC-02 y UC-03).
- Padre con **múltiples hijos**, autorizaciones distintas por hijo, en el mismo álbum.
- Cambio de **versión de plantilla** del colegio con consentimientos firmados sobre la versión anterior (rebloqueo de acceso, re-firma).
- Foto donde aparecen **un alumno autorizado y otro en blacklist** → ¿se oculta, se difumina el rostro, o se retiene toda la foto? (definir política).
- Persona en blacklist que aparece en **fotos ya descargadas** por terceros (límite del control retroactivo — documentar).
- Match facial de **falso positivo** contra blacklist → flujo de revisión/override del admin + audit.
- Embedding generado pero **Rekognition no detecta el rostro** (perfil, oclusión, menor de espaldas).

**Multi-tenancy**
- Usuario que pertenece a **más de un tenant** (¿se permite? ¿cuentas separadas?).
- Persona física presente en **varios tenants** (mismo rostro, embeddings y blacklists independientes — no se cruzan, regla nº "no base biométrica reutilizable").

**Procesamiento / escala**
- Evento masivo: **miles de fotos en horas** → backpressure, reintentos, idempotencia de la cola.
- Falla parcial de un lote (`processing_status = failed`) → reprocesamiento sin duplicar.
- Subida de **duplicados** (mismo archivo / misma foto re-subida).

**ARCO / ciclo de vida**
- Solicitud de **cancelación (borrado) ARCO** → debe ejecutarse también en **backups y downstream** (índices de búsqueda, embeddings, caches, CDN). Borrado lógico vs. físico y su retención.
- **Portabilidad** (Chile ARCO+) → export estructurado de datos del titular.
- Expiración / archivado de portales y álbumes; qué pasa con links públicos vivos.

**Distribución**
- Portal público con clave compartida masivamente (rate limiting, expiración de links).
- Signed URL filtrada / reusada fuera de contexto.

---

## 8. Criterios básicos de funcionamiento

Reglas de comportamiento que cualquier implementación debe cumplir:

1. **Toda foto tiene un estado explícito** de procesamiento (`queued → processing → processed → failed`) y de publicación (`approved / pending_review / hidden / rejected` + `hidden_by_consent_revocation`). Nada se publica sin pasar por la máquina de estados.
2. **Ningún álbum es visible sin aprobación** cuando el tenant tiene el rol Aprobador activo (Schools).
3. **El default es privado.** `Album.privacy_level` arranca en el nivel más restrictivo; abrir acceso es una acción deliberada.
4. **Match de blacklist = bloqueo por defecto.** Ante duda (match con baja confianza), la foto va a revisión, no a publicación.
5. **La revocación de consentimiento se refleja en distribución de forma inmediata** (síncrona/quasi-síncrona hacia blacklist; retroactiva hacia fotos ya publicadas).
6. **Toda acción crítica se audita** (consent firmado, foto publicada, blacklist modificada, ARCO ejecutado, export masivo, login admin).
7. **El procesamiento de fotos es asíncrono** (cola). La subida responde rápido; el procesamiento ocurre en background con estado consultable.
8. **Las descargas se sirven con signed URLs** de expiración corta, nunca con URLs públicas permanentes a S3.
9. **El cliente (controlador) puede ejecutar todas las acciones legales sobre sus datos sin pedir permiso a LEN** (ver §10, distinción controlador/procesador).
10. **El branding y los módulos activos se resuelven por tenant** en cada request, no hardcodeados.

---

## 9. Requerimientos no funcionales (no negociables)

**Aislamiento multi-tenant — PRIORIDAD UNO**
> Regla de Tomás: *"prefiero que se caiga la solución mil veces antes de que haya un cruce de información entre tenants"*. El aislamiento está **por encima de performance y costo.**
Opciones (define Ángel): schema-per-tenant / database-per-tenant / infrastructure-per-tenant (enterprise). Cualquiera que se elija, **ningún query, endpoint ni estructura puede permitir cruce entre tenants.**

**Encriptación**
- Tránsito: TLS 1.2+. Reposo: AES-256 en S3 (SSE-KMS, LEN custodio de llave). Disco cifrado en RDS.
- **Embeddings faciales cifrados igual que las imágenes.** PDFs de consentimiento con object lock + metadatos de integridad.

**Auth/Authz**
- Hashing bcrypt/argon2. **MFA obligatorio para roles administrativos**, opt-in para padres/finales.
- JWT de expiración corta (15 min–1 h) + refresh tokens rotativos. SSO SAML/OAuth para enterprise. Rate limiting en login.

**Trazabilidad e inmutabilidad**
- Audit log append-only para acciones críticas. Versionado de consentimientos (nunca se sobrescriben). Retención mínima 24 meses.

**Performance y escalabilidad**
- Procesamiento async vía queue (RabbitMQ/SQS). Cache de queries frecuentes en DAM Search. CDN para thumbnails. Capacidad elástica para picos. **Optimización de costo facial: match contra blacklist, no padrón (UC-02).**

**Disponibilidad**
- SLA target: **99.5% B2C**, **99.9% B2B enterprise**. DR: **RPO ≤ 4 h, RTO ≤ 8 h** para servicios críticos. Backups cifrados diarios, retención 30 días.

**Despliegue**
- **On-premise / híbrido es requerimiento, no extra.** No asumir cloud-only. Capacidad **híbrida AWS + Azure** cuando el cliente lo requiera (ej. Punta Cana).

---

## 10. Compliance y privacidad (feature comercial, no costo)

**Marco regulatorio:** Perú **Ley 29733** (autoridad ANPDP, derechos ARCO, registro de banco de datos), Chile **Ley 21.719** (ARCO+ con portabilidad, **protección reforzada de menores**, notificación de brechas), **GDPR** adoptado **voluntariamente como techo** (brechas en 72 h, Privacy by Design, DPIA para tratamiento masivo de datos de menores, DPO en alto riesgo).

**Roles legales (deben estar incrustados en el modelo de permisos):**

| Rol legal | Quién | Implicación arquitectónica |
|---|---|---|
| **Responsable / Controlador** | El cliente (colegio, empresa) | Decide fines, recolecta consentimiento, responde al titular. **Debe poder ejercer toda acción legal sobre sus datos sin pedir permiso a LEN.** |
| **Encargado / Procesador** | LEN | Procesa por cuenta del cliente bajo instrucciones (DPA). No usa datos para fines propios. |

**Lo que LEN NO hace, por diseño** (ningún feature nuevo puede violarlo):
- No construye base biométrica reutilizable fuera del tenant · no se conecta a RENIEC · no vende/cede datos a terceros · no entrena IA general con fotos del tenant · no permite acceso cruzado entre tenants · no indexa imágenes en buscadores públicos · **personal de LEN en modo zero-access** al contenido del tenant.

**Las cinco reglas que el dev nunca viola:**
1. PII en logs solo enmascarada o en debug local. **Producción sin PII en logs.**
2. Todo endpoint que retorna datos personales exige autorización **por rol Y por scope de contenido**.
3. **Nunca una sola validación:** cada acceso pasa por autenticación + rol + tenant + (si aplica) consentimiento.
4. Embeddings biométricos = mismo nivel de protección que imágenes. Nunca en logs ni en exports sin cifrar.
5. **Borrado ARCO se ejecuta también en backups y downstream** (índices, embeddings, caches).

---

## 11. Lineamientos de arquitectura (principios de diseño)

1. **Frontera plataforma vs aplicación** = la decisión más importante (ver §1.5). Default: si puede ser plataforma, es plataforma.
2. **Multi-tenant y multi-vertical desde el día uno.** Retrofittear aislamiento es la deuda técnica más cara.
3. **Privacy by Design.** Consentimiento, blacklist, encriptación y auditoría son cimientos, no add-ons.
4. **Modularidad real:** capacidades activables por `enabled_modules` por tenant. Nada hardcodeado a una vertical.
5. **Async-first** para todo lo pesado (procesamiento IA, reprocesos de blacklist, generación de PDFs/reportes).
6. **Event-driven donde aporte:** la propagación consent→blacklist→reclasificación de fotos es el caso canónico.
7. **API-ready desde ahora:** toda capacidad core debe poder exponerse vía API con **token auth, cuotas y billing por uso** (habilita DAM-API a futuro; "se diseña ahora, se activa después").
8. **Idempotencia y reintentos** en todo consumidor de cola y todo endpoint de ingesta.
9. **Stateless services** detrás del gateway; el estado vive en BD/almacenamiento, no en el proceso.
10. **Backward-compat en datos legales:** versionar plantillas y consentimientos; nunca migrar destruyendo el registro firmado original.

---

## 12. Requerimientos transversales fáciles de olvidar (anti-reproceso)

🔵 **[Recomendación]** — puntos que no están detallados en el Documento Maestro pero que, si no se diseñan temprano, generan reprocesos costosos. Amber debe decidirlos explícitamente:

- **Internacionalización (i18n/l10n):** mercados Perú/Chile/México/RD/Brasil → multi-idioma (es/pt) y formatos de fecha/número. Textos legales de consentimiento **por país y por idioma**.
- **Multi-moneda y multi-pasarela:** Stripe (internacional) + Niubiz (Perú). Impuestos por país. Facturación por tenant.
- **Data residency / soberanía de datos:** algunos clientes o reguladores exigen datos en-país. Atar a la estrategia híbrida AWS+Azure y al aislamiento por tenant.
- **Observabilidad:** tracing distribuido entre microservicios, métricas y alertas — **con PII enmascarada** (regla nº1). Definir cómo se depura sin ver contenido del tenant (zero-access).
- **Estrategia de borrado:** soft-delete vs hard-delete, ventanas de retención, y propagación a downstream/backups (ligado a ARCO).
- **Manejo de errores y estados de carga en UX:** el demo asume "todo sale bien". Definir estados de procesamiento, fallos de match, timeouts, reintentos visibles al usuario.
- **Versionado de API y contract testing** entre servicios (mencionado como decisión abierta).
- **Migración de usuarios existentes** de Strapi al nuevo Identity Service (sin romper sesiones ni perder histórico).
- **Cuotas y límites por plan** (storage, portales, Face IDs) — el demo los muestra fijos; deben ser reales por tenant/plan.
- **Notificaciones multicanal** (email/SMS/in-app) con plantillas por tenant y por idioma; consentimiento para comunicaciones.
- **Accesibilidad (a11y)** del portal público (lo usan miles de visitantes finales en móvil).
- **Rate limiting y anti-abuso** en portales públicos y en el endpoint de búsqueda por selfie.
- **Gestión de secretos y llaves** (KMS, rotación) — crítico por los embeddings biométricos.

---

## 13. Decisiones abiertas que Amber/Ángel deben cerrar

Frentes en evolución (no opiniones cerradas). Conviene cerrarlos antes de construir para evitar reprocesos:

| Decisión | Owner | Notas |
|---|---|---|
| Migración Big-bang vs incremental (cuán agresivo el descosido de Strapi) | Ángel | Dirección actual: incremental |
| Stack base de microservicios (Node/Python/Go) y orquestación (K8s/ECS/serverless) | Ángel | — |
| BD por dominio: relacional vs documental; una BD por servicio vs compartidas | Ángel | — |
| Comunicación entre servicios: REST/gRPC vs eventos | Ángel | Probablemente híbrido |
| Nivel de aislamiento multi-tenant (schema / database / infra por tenant) | Ángel | Prioriza aislamiento sobre costo |
| Esqueleto de microservicio (**proyecto Amber**: template + CLI) | Williams | — |
| Estrategia de testing (contract testing, staging por servicio) | Ángel | — |
| pgvector vs alternativa para embeddings; Elasticsearch para DAM Search | Ángel | Tentativo |
| Política ante foto con alumno autorizado + alumno en blacklist (ocultar/difuminar/retener) | Producto + Legal | Casuística §7 |

---

## 14. Criterios de aceptación / Definition of Done (módulos críticos)

🔵 **[Recomendación]** mínimos verificables antes de dar por listo un módulo:

- **Consent Service:** firma genera PDF inmutable verificable; versionado preservado; rechazo de módulo crítico crea entrada de blacklist; bloqueo de acceso si falta consentimiento vigente; todo auditado.
- **Blacklist Service:** propagación consent→blacklist en **milisegundos**; reproceso retroactivo de álbumes en scope; embeddings cifrados; match configurable por umbral de confianza.
- **Identity/Authorization:** ninguna ruta accede a datos de otro tenant (test de aislamiento automatizado); toda autorización valida rol **y** scope; MFA obligatorio en roles admin.
- **Content/Pipeline:** subida responde sin esperar procesamiento; máquina de estados completa; reintentos idempotentes; fallo parcial reprocesable sin duplicar.
- **Audit Service:** append-only real (no editable/borrable); sin PII en claro; consultable por tenant.
- **Transversal:** prueba de borrado ARCO que verifica eliminación en BD + backups + índices + caches.

---

## 15. Riesgos y anti-patrones a evitar

- **Construir "para colegios" lo que debe ser plataforma** → reescritura al entrar el 2º vertical.
- **Aislamiento de tenant a nivel de aplicación en vez de datos** → un bug = fuga entre tenants (el peor escenario).
- **Propagación lenta consent→blacklist** → fotos publicadas sin consentimiento (riesgo legal directo, dado UC-02).
- **Tratar embeddings como dato común** (logs, exports sin cifrar) → violación de datos biométricos.
- **Acoplar billing/branding/idioma al código** en lugar de a config por tenant → no escala geográficamente.
- **Procesamiento síncrono de lotes grandes** → timeouts y caída en eventos masivos.
- **Tomar el demo como base de código.** Es spec de UX (vanilla JS, `sessionStorage`, sin backend). El valor a heredar es el **modelo de dominio y los flujos validados con clientes**, no el código.

---

## 16. Glosario y convenciones

- **Tenant:** cliente aislado (colegio, empresa). **Subversión:** configuración de la plataforma para una vertical (`schools`, `dam_b2b`, `dam_full`).
- **Beneficiario:** sujeto del contenido (alumno, empleado, miembro). **Apoderado:** titular de cuenta que gestiona beneficiarios (padre→hijos).
- **Blacklist:** conjunto de personas cuyo contenido se oculta; en Schools se alimenta automáticamente al rechazar consentimiento crítico.
- **Consentimiento crítico:** módulo cuyo rechazo envía a blacklist global.
- **Embedding biométrico:** vector facial; **dato sensible**, protección equivalente a la imagen.
- **ARCO:** Acceso, Rectificación, Cancelación, Oposición (+ Portabilidad en Chile).
- **Controlador / Procesador:** el cliente decide (responsable); LEN procesa (encargado) bajo DPA.
- **Banco de fotos seguras:** subset curado cuyas familias autorizaron todos los canales de difusión externa.

---

### Referencias
- Documento Maestro LEN v1.0 (Abril 2026) — visión, productos, arquitectura técnica, UC-01..05, modelo de datos, RNF, compliance.
- [DAM-DEMO-SCOPE-PARA-AMBER.md](DAM-DEMO-SCOPE-PARA-AMBER.md) — qué del prototipo es flujo real vs. simulado.
- Prototipo interactivo (este repo) — fuente de UX/UI.
