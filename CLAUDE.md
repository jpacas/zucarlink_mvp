# Zucarlink MVP — Guías para Claude

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
