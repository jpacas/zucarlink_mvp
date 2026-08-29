# Sistema de Diseño — Zucarlink

Este documento formaliza el sistema de diseño ya implementado en el proyecto (colores, tipografía, espaciado, componentes) y define las áreas que quedaban abiertas: nivel de decoración, layout, y motion. No es un rediseño: es la fuente de verdad para lo que ya existe en `src/styles/index.css`, más las decisiones que faltaban.

Preview visual: https://claude.ai/code/artifact/4b22e785-ea63-4c44-bd46-865c2996c35c

## Contexto de producto
- **Qué es:** Red profesional para la industria azucarera.
- **Para quién:** Técnicos de campo, ingenios azucareros y proveedores de insumos/servicios.
- **Rubro / referencias:** B2B / red profesional (LinkedIn-style) cruzado con agtech y marketplaces de insumos (ej. Agrofy, Engormix).
- **Tipo de proyecto:** Web app (dashboard + directorio + foro + mensajería), no sitio de marketing.
- **Lo memorable:** Cercanía y comunidad — Zucarlink debe sentirse como una comunidad de colegas del sector, no como un ERP corporativo frío.

## Dirección estética
- **Dirección:** Profesional-cálido. Grid-disciplinado en dashboard/admin (donde el usuario técnico necesita previsibilidad de datos); editorial en foro y perfiles (donde vive la comunidad: fotos grandes, citas destacadas, jerarquía tipográfica marcada).
- **Nivel de decoración:** Intencional — sin texturas nuevas. El sistema ya aporta calidez a través de sombras suaves (`--shadow-sm/md/lg`) y radios generosos, sin necesidad de ornamento adicional.
- **Mood:** Serio pero accesible. La marca (azul marino/eléctrico) transmite confianza técnica; el tratamiento editorial en foro/perfiles y el color por rol transmiten pertenencia.
- **Referencias:** Agrofy, Engormix (comparables directos en agro/Latinoamérica); LinkedIn (estructura de red profesional).

## Patrón central: color por rol
Ya implementado en `src/styles/index.css`, no documentado hasta ahora. Es el mecanismo principal para lograr "cercanía y comunidad": de un vistazo se identifica quién es quién en la red.

| Rol | Variable | Color | Uso |
|---|---|---|---|
| Ingenio | `--role-ingenio` | `--brand` #0029E2 | Ingenios azucareros |
| Técnico | `--role-tecnico` | `--accent-green` #0DDB89 | Técnicos de campo |
| Proveedor | `--role-proveedor` | `--accent-orange` #FF724B | Proveedores de insumos/servicios |
| Info | `--role-info` | `--accent-cyan` #00C9FF | Contenido general/informativo |

Cada rol tiene variantes `-soft` (fondo de badge) e `-ink`/`-strong` (texto legible sobre fondo claro). **Extender este patrón** más allá de badges: avatares, bordes de card de perfil, menciones en foro — la identidad de rol debe ser instantánea en toda la red.

## Tipografía
- **Display/Hero:** Cirka Bold (`src/assets/fonts/Cirka-Bold.otf`) — títulos, citas destacadas en perfiles.
- **Body/UI:** Neurial Grotesk, pesos Regular/Medium/Bold/Extrabold (`src/assets/fonts/NeurialGrotesk-*.otf`) — todo el resto.
- **Datos/Tablas:** Neurial Grotesk con `font-variant-numeric: tabular-nums` (ya activo en componentes de stats).
- **Código:** No definido — usar monospace del sistema si surge la necesidad (no hay superficies de código en el producto).
- **Carga:** Self-hosted vía `@font-face` en `src/styles/index.css`, archivos OTF locales. No usar Google Fonts ni CDN externo — son fuentes con licencia propia.
- **Escala:** No hay una escala modular formal en el código; usar `clamp()` para hero (36–56px) y bajar por contexto (28px stat destacado, 22px cita, 16px body, 14px UI, 12px labels/eyebrows).

## Color
- **Enfoque:** Balanceado — primario + acentos semánticos por rol (ver tabla arriba).
- **Primario:** `--brand-primary` #201747 (Pantone 275 C) — texto principal, marca.
- **Acción/CTA:** `--brand` #0029E2, hover `--brand-strong` #001ec0.
- **Neutrales:** `--bg` #f4f4f6, `--bg-accent` #e0e0ea, `--surface` blanco 95%, `--text-muted`/`--text-soft` como alfas de `--text`.
- **Semántico:** éxito → `--accent-green`/`--role-tecnico-ink`, alerta suave → `--accent-orange`/`--role-proveedor-strong`, error → `--danger` #cc3722, info → `--accent-cyan`/`--role-info-ink`.
- **Modo oscuro:** No implementado, y es una decisión deliberada (SAFE), no una omisión — Zucarlink es una herramienta de uso diurno/de campo donde la legibilidad al aire libre en modo claro importa más que un modo oscuro. Revisar si el uso real (horarios, contexto de uso móvil de noche) contradice esta suposición antes de invertir en modo oscuro.
- **Regla de marca:** No alterar los colores del logo (`<ZucarLogo />`) — lo prohíbe el Manual de Marca.

## Espaciado
- **Unidad base:** 4px.
- **Escala:** `--space-1` a `--space-9` = 4/8/12/16/20/24/32/48/64px.
- **Densidad:** Cómoda — ni compacta (el usuario de campo no siempre usa mouse de precisión) ni espaciosa (es una app de datos, no un sitio editorial puro).

## Layout
- **Enfoque:** Híbrido.
  - **Dashboard/admin/directorio:** grid-disciplinado — columnas predecibles, tablas con `tabular-nums`, sidebar fija.
  - **Foro/perfiles:** editorial — foto grande, cita destacada en Cirka Bold, jerarquía tipográfica marcada en vez de tarjetas uniformes.
- **Radios:** `--radius-xs` 8px, `sm` 12px, `md` 16px, `lg` 22px, `xl` 28px, `pill` 999px — ya escalados jerárquicamente, mantener.
- **Sombras:** `--shadow-sm/md/lg` ya definidas, usar en vez de bordes duros para elevar cards de perfil/foro.

### Responsive
- **Breakpoints:** `max-width: 640px` (mobile), `820px` (tablet/mobile grande), `1024px` — ad-hoc, no hay una escala formal más allá de estos 3 puntos. Reusar estos, no introducir valores nuevos sin necesidad.
- **Padding de cards** (`.hero-card`, `.content-card`, `.auth-card`): `clamp(20px, 5vw, 32px)` — fluido en vez de un salto fijo por breakpoint, para que no se sienta "pesado" en pantallas angostas (era `32px` fijo hasta 820px, bajaba recién a `24px`).
- **Título de hero:** `clamp(2rem, 6vw, 4.2rem)` — piso bajado de 2.4rem a 2rem para no inflar el hero en mobile.
- **CTAs del hero de home:** con 3 acciones de peso distinto (crear perfil / registrar empresa / explorar), solo la primaria va a ancho completo en mobile/tablet; las otras dos comparten una fila compacta (`.hero-card--home .actions`). El patrón genérico `.actions .button { width:100% }` sigue aplicando tal cual al resto del sitio (formularios, diálogos) — no tocar eso sin revisar los ~65 usos de `.actions` primero.
- **Tarjetas en `.section-grid`:** `align-content: start` en `.content-card` para que el contenido no se estire cuando una tarjeta hermana es más alta — antes dejaba un hueco entre el texto y el botón de acción.

## Motion
- **Enfoque:** Minimal-funcional. Transiciones de 120–150ms en `ease` sobre bordes/fondos/color, sin coreografía ni scroll-driven animation.
- **Rationale:** Coherente con un producto usado en el campo, potencialmente con conexión más lenta o dispositivos de gama media.
- **Riesgo a futuro (no implementado aún):** Micro-interacción cálida puntual en momentos de comunidad (nueva respuesta de foro, nueva conexión) usando el color de rol correspondiente — reforzaría cercanía emocional sin romper la sobriedad general. Evaluar solo si hay evidencia de que el producto se siente "frío" en uso real.

## Patrones de UX

Relevado directamente de los componentes existentes (`AppHeader`, `Breadcrumbs`,
`AttachmentInput`/`AttachmentPreviewList`/`AttachmentView`, `src/lib/media-storage.ts`).
Documenta lo que ya funciona para que no se reinvente distinto en cada feature nueva.

### Navegación
- **Header fijo** (`AppHeader.tsx`): logo a la izquierda, nav a la derecha. En mobile colapsa a menú hamburguesa con backdrop (`.nav-backdrop`) que cierra al tocar afuera o al navegar.
- **Links contextuales por tipo de cuenta:** el proveedor ve "Panel / Directorio / Perfil comercial / Solicitudes"; el resto ve "Panel / Directorio". Los servicios públicos (Foro, Información, Proveedores) se agregan sin duplicar rutas ya presentes en la cuenta. Mantener esta lógica de deduplicación al agregar nuevos links — no listar la misma ruta dos veces.
- **Estado activo:** `NavLink` con clase `nav-link--active`; usar `end` en rutas raíz (`/app`) para que no quede "activa" en todas las subrutas.
- **Badge de no leídos:** contador visual solo en "Mensajes" (`nav-unread-badge`), condicionado a que la cuenta no sea `provider`. Reutilizar este patrón (badge numérico sobre el link) para cualquier otro contador futuro (notificaciones, solicitudes), no inventar un tratamiento nuevo.
- **Menú de usuario:** trigger circular con avatar (o iniciales de fallback), dropdown con email, links de cuenta, y "Cerrar sesión" separado por un divisor y en rojo (`--danger`) al final. Cierra con click-outside.
- **Breadcrumbs:** componente propio (`Breadcrumbs.tsx`) para rutas profundas (ej. dentro de directorio o admin) — último ítem sin link y con `aria-current="page"`.

### Botones — jerarquía de 4 niveles
1. **Primario** (`.button`): relleno `--brand`, radius pill, `min-height: 46px` — la acción principal de la pantalla, una sola por contexto.
2. **Secundario** (`.button--secondary`): outline azul, fondo transparente — acción alternativa, no destructiva.
3. **Ghost** (`.button--ghost`): fondo sutil gris translúcido, sin borde — acciones terciarias (cancelar, cerrar).
4. **Danger** (`.button--danger`): relleno rojo — solo para acciones destructivas/irreversibles.
- **Tamaño compacto:** `.button--sm` (`min-height: 34px`) para toolbars y contextos densos (ej. `AttachmentInput` variante `button`).
- **CTAs por rol — ya implementado, extender, no reinventar:** `.button--tecnico` (verde) y `.button--proveedor` (naranja) sobrescriben el color de fondo cuando la acción es específica de ese rol (ej. "Contactar técnico"). El azul sigue siendo el primario global cuando la acción no es rol-específica. Combinable con `--secondary` para la variante outline por rol (`.button--secondary.button--tecnico`, etc.).

### Medios: fotos, videos y archivos
- **Límites de tamaño (`src/types/storage.ts`, `src/lib/media-storage.ts`):** imágenes hasta 10MB (se re-escalan a un máximo de 1600px antes de subir), videos hasta 50MB, documentos (PDF/DOCX/XLSX) hasta 20MB. Máximo 6 adjuntos por mensaje (`MAX_ATTACHMENTS_PER_MESSAGE`).
- **Selector de adjuntos** (`AttachmentInput`): variante `icon` (📎 solo, para composer de mensajes) o `button` (📎 + label, para formularios). Se deshabilita automáticamente al llegar al límite de adjuntos.
- **Preview antes de enviar** (`AttachmentPreviewList`): chips en fila horizontal con scroll (`overflow-x: auto`) — el layout no debe reflowar ni crecer en alto al agregar adjuntos. Thumbnail 28×28px para imágenes, ícono emoji por tipo (🎬 video, 📄 PDF, 📝 Word, 📊 Excel) para el resto. Botón "×" para quitar.
- **Vista de adjuntos ya enviados** (`AttachmentView`): imágenes y videos con `max-height: 320px`, `object-fit: contain`, fondo `--surface-alt` de relleno; documentos como link con ícono + nombre. Siempre mostrar nombre de archivo + tamaño cuando estén disponibles.
- **Avatares — escala jerárquica por contexto**, `border-radius` proporcional al tamaño (más chico = más redondeado relativo):
  | Contexto | Tamaño | Radio |
  |---|---|---|
  | Perfil (`avatar-card`) | 88×88px | 24px |
  | Card de directorio | 48×48px | 14px |
  | Mensajes/compacto (`--sm`) | 36×36px | proporcional |
  | Header (nav-user-trigger) | 40×40px | circular |
  - Fallback: iniciales sobre gradiente `--brand-primary` → `--brand`. Mantener este fallback en cualquier superficie nueva que muestre avatar — nunca un ícono genérico de usuario.

## Riesgos deliberados de esta propuesta
1. **Extender el color por rol más allá de botones y badges** (ya implementado en CTAs `--tecnico`/`--proveedor`) hacia avatares, bordes de card de perfil y menciones en foro — gana reconocimiento instantáneo de "quién es quién" en toda la red, no solo en las acciones; cuesta disciplina para no saturar cada pantalla de color.
2. **Tratamiento editorial en foro y perfiles** (foto grande, cita destacada, jerarquía tipográfica) en vez de tarjetas uniformes tipo directorio corporativo — refuerza que son personas reales de la industria; cuesta más trabajo de diseño de componentes que una card genérica.

## Log de decisiones
| Fecha | Decisión | Rationale |
|---|---|---|
| 2026-08-29 | Creación inicial de DESIGN.md | Formaliza el Manual de Marca ya implementado (CLAUDE.md) + investigación de comparables (Agrofy, Engormix, B2B/agtech) vía `/design-consultation`. Documenta el patrón de color-por-rol no explicitado antes, y define modo oscuro (no) y motion (minimal-funcional) como decisiones explícitas en vez de omisiones. |
| 2026-08-29 | Agregada sección "Patrones de UX" | A pedido explícito del usuario, se amplió el alcance más allá de lo visual (color/tipografía) a navegación, jerarquía de botones y manejo de medios (fotos/videos/archivos), relevando la implementación real en `AppHeader`, `AttachmentInput`/`AttachmentPreviewList`/`AttachmentView` y `media-storage.ts`. Se descubrió que el patrón color-por-rol ya se extiende a botones (`.button--tecnico`/`.button--proveedor`), no solo a badges — se corrigió el Riesgo #1 para reflejarlo. |
| 2026-08-29 | Fix responsive: padding fluido, título de hero más chico en mobile, CTAs de home no apiladas las 3 a ancho completo, `align-content:start` en content-card | El usuario reportó que los tamaños y proporciones se sentían "demasiado grandes" en el sitio real. Verificado con `browse` (screenshots en 375/768/1280px) contra `localhost:5173`: 3 botones full-width apilados en el hero de home, padding fijo de 32px sin bajar hasta los 820px, piso de `clamp` del h1 muy alto, y `.content-card` estirándose para llenar el alto de una tarjeta hermana con más contenido, dejando un hueco antes del botón. Corregido y reverificado visualmente con capturas antes/después. |
