# Zucarlink MVP — Guías para Claude

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/office-hours` - YC-style office hours / product brainstorming
- `/plan-ceo-review` - CEO-level plan review
- `/plan-eng-review` - Engineering plan review
- `/plan-design-review` - Design plan review
- `/design-consultation` - Design system consultation
- `/design-shotgun` - Rapid design exploration
- `/design-html` - HTML design generation
- `/review` - Code review
- `/ship` - Ship code
- `/land-and-deploy` - Land and deploy changes
- `/canary` - Canary deployments
- `/benchmark` - Performance benchmarking
- `/browse` - Web browsing (use this for ALL web browsing)
- `/connect-chrome` - Connect to Chrome
- `/qa` - QA testing + fix bugs
- `/qa-only` - QA report only (no fixes)
- `/design-review` - Visual QA and design polish
- `/setup-browser-cookies` - Set up browser cookies
- `/setup-deploy` - Setup deployment
- `/setup-gbrain` - Setup gbrain
- `/retro` - Retrospective
- `/investigate` - Investigation
- `/document-release` - Post-ship docs update
- `/document-generate` - Generate documentation
- `/codex` - Code exploration
- `/cso` - Chief Strategy Officer
- `/autoplan` - Automatic planning
- `/plan-devex-review` - Plan devex review
- `/devex-review` - Developer experience review
- `/careful` - Careful mode
- `/freeze` - Freeze changes
- `/guard` - Guard mode
- `/unfreeze` - Unfreeze changes
- `/gstack-upgrade` - Upgrade gstack
- `/learn` - Learning mode

## Manual de Marca (implementado)

El sitio implementa fidelidad total al Manual de Marca Básico de Zucarlink (Abril 2020).

### Colores corporativos (CSS variables en `src/styles/index.css`)

| Variable | Valor | Uso |
|---|---|---|
| `--brand-primary` | `#201747` | Azul marino — color primario de marca (Pantone 275 C) |
| `--brand` | `#0029E2` | Azul eléctrico — acciones/CTAs/botones |
| `--brand-strong` | `#001ec0` | Azul oscuro — hover de botones |
| `--brand-soft` | `rgba(0,41,226,0.10)` | Tinte azul suave |
| `--accent-cyan` | `#00C9FF` | Complementario 1 — Agua y Aire |
| `--accent-orange` | `#FF724B` | Complementario 2 — Calor |
| `--accent-green` | `#0DDB89` | Complementario 3 — Caña Azúcar |
| `--bg` | `#f4f4f6` | Fondo base |
| `--text` | `#201747` | Texto principal |

### Tipografía

- **Neurial Grotesk** (Regular 400, Medium 500, Bold 700, Extrabold 800) — fuente principal de UI
  - Archivos en `src/assets/fonts/NeurialGrotesk-*.otf`
- **Cirka Bold** — fuente corporativa para títulos de display
  - Archivo en `src/assets/fonts/Cirka-Bold.otf`

### Logotipo

- Usar el componente React `<ZucarLogo />` de `src/components/ZucarLogo.tsx`
- Props: `variant` ("light"|"dark"), `size` (px), `wordmark` (boolean)
- `variant="light"` — símbolo color + texto navy `#201747` (sobre fondos claros)
- `variant="dark"` — símbolo color + texto blanco (sobre fondos oscuros)
- Símbolo hexagonal: pétalos cían/naranja/verde alternos, centro `#201747`
- **No alterar los colores del logo** — prohibido según el manual

### Reglas de uso de color

- Botones primarios y CTAs: `--brand` (#0029E2)
- Header/nav de la aplicación: transparente sobre `--bg`
- Fondos de superficie: `--surface` (#fff) / `--surface-alt` / `--surface-strong`
- Los 3 colores complementarios se usan como badges/etiquetas semánticas:
  - Cián (#00C9FF) — agua, información técnica
  - Naranja (#FF724B) — calor, alertas suaves, categorías activas
  - Verde (#0DDB89) — caña/naturaleza, éxito, agricultores

## Stack técnico

- React 19 + Vite + TypeScript
- Styling: CSS custom properties en `src/styles/index.css` (un solo archivo global)
- Backend: Supabase
- Routing: React Router DOM

## Convenciones de código

- Componentes en `src/components/` (compartidos) y `src/features/` (por dominio)
- CSS: clases BEM-inspired, sin módulos CSS ni Tailwind
- No añadir dependencias de estilos nuevas — usar CSS vanilla
