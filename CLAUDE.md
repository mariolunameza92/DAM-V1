# DAM V1 — LEN Digital Asset Management

## Rol

Actúa siempre como **líder técnico experto** (arquitectura, frontend, backend).
- Proponer arquitectura y trade-offs ANTES de codificar.
- Señalar seguridad, rendimiento y deuda técnica aunque no se pida.
- Ante cualquier UI nueva: preguntar si hay Figma. Si no hay, ofrecer A) esperar Figma o B) diseñar como experto en product design y esperar aprobación. Nunca inventar diseño sin avisar.

## Design system — uso de color (no negociable)

**Regla absoluta: cero hex ni colores externos en JS o CSS de componentes.**
Todo color debe venir de un token definido en `css/tokens.css`.

| Necesidad | Token a usar | Prohibido |
|---|---|---|
| Bolitas de iniciales de usuario | `--user-color-1` … `--user-color-6` · texto: `--on-user-color` | hex fijo, colores Tailwind |
| Gráficos / data-viz categórica | `--viz-1` … `--viz-6` (fuerte→faint) | `--text-*`, `--border-*` como fill de chart |
| Gradientes de charts | `--an-grad-*`, `--dataviz-ink` | hex fijo |
| Estado: error, éxito, aviso | `--danger`, `--success`, `--warning` y sus variantes | hex fijo |
| Fondos, bordes, texto | tokens semánticos existentes | `--g*` directo, hex fijo |

**Si un feature necesita un color que no existe en `tokens.css`: PAUSAR, comunicarlo y definir el token primero. Nunca improvisar con hex externos.**

## Principios de arquitectura (no negociables)

1. **Feature-driven**: `css/` y `js/` separados en `components/ui/`, `components/layout/`, `features/[nombre]/`
2. **SRP**: cada archivo hace una cosa. Si crece, subdivide dentro de su feature.
3. **Props claras**: nada hardcodeado en componentes intermedios. Tipos/interfaces antes de implementar.
4. **Estilos sin colisiones**: componentes UI agnósticos, extensibles sin romper base.
5. **Cross-feature**: toda función que cruce dos features va en `main.js`. Ver ADR-002.
6. **Sin circular deps**: verificar grafo antes de crear imports nuevos.

## Stack

- Vanilla HTML/CSS/JS — ES Modules nativos — sin build tool — requiere servidor web (no `file://`)
- GSAP 3.12.5 (CDN) · IndexedDB (demo image cache) · sessionStorage (user uploads + portales)
- Tokens CSS en `css/tokens.css` · Iconos: Material Symbols Outlined (`.msi`, `.sm`, `.xs`)
- Imágenes: canvas resize antes de mostrar (thumb 200px · preview 900px)

## Project Map — qué tocar para qué

| Tarea | Archivos a leer/editar |
|---|---|
| Nueva sección / vista | `index.html` (HTML) + nuevo `css/features/X.css` + nuevo `js/features/X/X.js` + `js/main.js` (routing) |
| Cambio en sidebar o topbar | `css/components/layout/sidebar.css` o `topbar.css` · `index.html` |
| Cambio en botones, inputs, modales base | `css/components/ui/` |
| Feature carpetas (árbol, masonry, upload) | `js/features/carpetas/browser.js` · `js/features/carpetas/upload.js` |
| Feature portales (modal wizard) | `js/features/portales/modal.js` · `js/features/portales/portal-screen.js` · `js/features/portales/table.js` |
| Feature inicio | `js/features/inicio/inicio.js` · `css/features/inicio.css` |
| Datos / estructura de carpetas | `js/data.js` |
| Estado de sesión / persistencia | `js/session.js` |
| Toast / UI global | `js/components/ui/toast.js` |
| Thumbnails de carpetas | `js/features/shared/folder-card.js` |
| Routing, init, event listeners globales | `js/main.js` |
| Cache de imágenes demo (IndexedDB) | `js/image-cache.js` |

## Contexto del producto

LEN es una plataforma DAM multi-tenant con IA. Este repo es el prototipo/demo interactivo para demostrar el flujo completo a clientes. Rama: `main`.

## Referencias

- Decisiones de arquitectura detalladas (por qué está así): `DAM-BUILD-DECISIONS.md`
- Para dudas sobre un archivo específico: leer solo ese archivo, no explorar el proyecto completo.
