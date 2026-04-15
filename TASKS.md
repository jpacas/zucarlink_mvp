# TASKS.md — Zucarlink / Semana 4

## Objetivo de este archivo

Este archivo descompone la **Semana 4: Setup Técnico** en tareas ejecutables para trabajar con Codex de forma ordenada, verificable y sin dispersión.

La meta de cierre es dejar el proyecto listo para iniciar la **Semana 5: Módulo de Perfiles** sin rehacer base técnica.

---

## Regla de trabajo

Trabajar **una fase a la vez**.

No avanzar a la siguiente fase hasta que:
- el código compile,
- los checks definidos pasen,
- y el entregable de la fase esté realmente cerrado.

Cada entrega de Codex debe incluir al final:
- resumen de cambios
- archivos modificados
- comandos ejecutados
- resultado de validaciones
- riesgos o pendientes

---

## Fase 0 — Preparación del repositorio

### Objetivo
Dejar el repo listo para trabajar con Codex y con una estructura clara.

### Tareas
- Crear repositorio Git si no existe.
- Confirmar que el repo tenga nombre claro.
- Guardar `AGENTS.md` en la raíz del repositorio.
- Guardar `TASKS.md` en la raíz del repositorio.
- Guardar `.codex/config.toml` dentro de la carpeta `.codex/`.
- Crear `.gitignore` correcto.
- Crear `README.md` base con instrucciones iniciales.
- Crear `.env.example` con variables requeridas.

### Done when
- El repo tiene estructura inicial clara.
- Existen `AGENTS.md`, `TASKS.md`, `.codex/config.toml`, `.gitignore`, `README.md`, `.env.example`.
- El repo está listo para inicializar el proyecto frontend.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 0.
Objetivo: dejar el repositorio listo para iniciar desarrollo.
Restricciones: no crear código de negocio todavía.
Done when: existen los archivos base del repo y la estructura mínima de trabajo.
```

---

## Fase 1 — Inicialización del frontend base

### Objetivo
Crear el frontend base con Vite + React + TypeScript.

### Tareas
- Inicializar proyecto con Vite.
- Configurar TypeScript.
- Instalar dependencias mínimas necesarias.
- Agregar React Router DOM.
- Definir estructura simple de carpetas.
- Crear layout base.
- Confirmar scripts mínimos:
  - `dev`
  - `build`
  - `preview`
  - `typecheck`

### Estructura sugerida
```text
src/
  app/
  components/
  features/
  layouts/
  pages/
  routes/
  lib/
  styles/
  types/
```

### Done when
- El proyecto corre localmente.
- `npm run build` funciona.
- `npm run typecheck` funciona.
- Existe una estructura simple y clara.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 1.
Objetivo: crear el frontend base con Vite + React + TypeScript.
Restricciones: usar pocas dependencias y mantener estructura simple.
Done when: el proyecto corre, build pasa y typecheck pasa.
```

---

## Fase 2 — Navegación y rutas base

### Objetivo
Dejar listas las rutas públicas y privadas del MVP, aunque todavía sean skeletons.

### Tareas
- Crear rutas públicas:
  - `/`
  - `/login`
  - `/register`
  - `/directory`
  - `/forum`
  - `/providers`
- Crear rutas privadas:
  - `/app`
  - `/app/profile`
  - `/app/messages`
  - `/app/settings`
- Crear páginas placeholder limpias.
- Crear layout público.
- Crear layout privado.
- Preparar componente de protección de rutas.
- Crear navbar base.

### Done when
- Se puede navegar entre rutas públicas.
- Las rutas privadas existen y están protegidas o preparadas para protección.
- No hay errores de routing.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 2.
Objetivo: crear la navegación y las rutas base públicas y privadas.
Restricciones: usar pantallas placeholder simples; no construir todavía lógica de negocio.
Done when: todas las rutas mínimas existen y el routing funciona correctamente.
```

---

## Fase 3 — Configuración de Supabase

### Objetivo
Conectar Supabase como base de auth, database y storage.

### Tareas
- Instalar SDK de Supabase.
- Crear cliente de Supabase.
- Configurar variables de entorno.
- Documentar variables requeridas en `.env.example`.
- Preparar carpetas/utilidades para acceso a Supabase.
- Verificar conexión básica.

### Variables mínimas esperadas
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Done when
- El frontend puede inicializar cliente Supabase sin errores.
- Las variables de entorno están documentadas.
- Existe una integración base limpia.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 3.
Objetivo: integrar Supabase de forma limpia en el proyecto.
Restricciones: no construir todavía la lógica completa del perfil ni del foro.
Done when: el cliente de Supabase queda listo y documentado.
```

---

## Fase 4 — Autenticación base

### Objetivo
Dejar funcionando registro, login, logout y persistencia de sesión.

### Tareas
- Implementar registro con:
  - tipo de cuenta
  - nombre completo
  - email
  - contraseña
- Implementar login.
- Implementar logout.
- Implementar persistencia de sesión.
- Proteger rutas privadas.
- Redirigir usuarios no autenticados.
- Preparar contexto o mecanismo simple de auth.

### Regla funcional
No pedir más datos que los mínimos del registro inicial.

### Done when
- Un usuario se puede registrar.
- Un usuario se puede loguear.
- La sesión persiste al recargar.
- El usuario puede cerrar sesión.
- Las rutas privadas requieren sesión.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 4.
Objetivo: implementar auth base con Supabase.
Restricciones: registro mínimo, flujo simple, sin overengineering.
Done when: registro, login, logout y persistencia de sesión funcionan de extremo a extremo.
```

---

## Fase 5 — Esquema inicial de base de datos

### Objetivo
Dejar la base de datos lista para Semana 5.

### Tablas mínimas esperadas
- `profiles`
- `specialties`
- `profile_specialties`
- `companies`
- `experiences`
- `conversations`
- `messages`
- `forum_categories`
- `forum_topics`
- `forum_replies`
- `providers`
- `provider_leads`

### Tareas
- Crear scripts SQL o migraciones iniciales.
- Definir claves primarias y relaciones mínimas.
- Crear timestamps útiles.
- Evitar campos especulativos.
- Documentar el esquema.

### Done when
- El esquema inicial existe y es coherente con el MVP.
- El esquema soporta Semana 5 sin rediseño fuerte.
- Las relaciones mínimas están claras.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 5.
Objetivo: crear el esquema inicial de base de datos del MVP.
Restricciones: priorizar simplicidad; no agregar tablas especulativas.
Done when: existe un esquema claro, documentado y útil para Semana 5.
```

---

## Fase 6 — Seguridad y privacidad mínima

### Objetivo
Proteger correctamente la base antes de seguir construyendo.

### Tareas
- Activar Row Level Security donde corresponda.
- Crear políticas mínimas para perfiles.
- Asegurar que cada usuario solo pueda editar su propio perfil.
- Separar lo público de lo privado.
- No exponer datos sensibles por defecto.
- Revisar que las rutas privadas no sean accesibles sin sesión.

### Done when
- La base tiene reglas mínimas de acceso.
- El usuario solo puede editar lo suyo.
- No hay exposición pública innecesaria.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 6.
Objetivo: aplicar seguridad y privacidad mínima del MVP.
Restricciones: mantener políticas simples pero correctas.
Done when: los datos sensibles están protegidos y el acceso está bien delimitado.
```

---

## Fase 7 — Storage para avatars

### Objetivo
Dejar lista la infraestructura para fotos de perfil.

### Tareas
- Crear bucket para avatars.
- Definir reglas mínimas de acceso.
- Preparar helper o servicio base para subida.
- Documentar restricciones recomendadas:
  - formato
  - tamaño máximo
  - convención de nombres

### Done when
- Existe bucket funcional para avatars.
- La app está preparada para integrar upload en Semana 5.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 7.
Objetivo: preparar storage para avatars.
Restricciones: no construir todavía el editor completo de perfil.
Done when: el bucket y la base de integración quedan listos.
```

---

## Fase 8 — Skeletons funcionales del MVP

### Objetivo
Dejar listas las pantallas base para seguir construyendo sin fricción.

### Tareas
- Crear pantallas base limpias para:
  - Home
  - Login
  - Register
  - Directory
  - Forum
  - Providers
  - App dashboard
  - Profile
  - Messages
  - Settings
- Mostrar claramente cuáles son públicas y cuáles privadas.
- Agregar placeholders consistentes.

### Done when
- Todas las pantallas mínimas existen.
- La navegación se siente ordenada.
- La base visual está lista para Semana 5.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 8.
Objetivo: crear skeletons funcionales de las pantallas base del MVP.
Restricciones: mantener diseño simple; no implementar lógica profunda.
Done when: todas las pantallas base existen y navegan correctamente.
```

---

## Fase 9 — Deploy y ambiente de prueba

### Objetivo
Dejar una URL funcional para validar el sistema.

### Tareas
- Configurar deploy en Vercel o Netlify.
- Configurar variables de entorno en hosting.
- Verificar que build y deploy funcionen.
- Validar rutas principales.
- Validar auth en ambiente desplegado.

### Done when
- Existe URL accesible.
- La app carga correctamente online.
- Registro y login funcionan en ambiente desplegado.

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 9.
Objetivo: dejar el proyecto desplegado y funcional en ambiente de prueba.
Restricciones: no abrir nuevas funcionalidades; solo cerrar setup técnico.
Done when: existe una URL funcional con auth operativa.
```

---

## Fase 10 — Validación final end-to-end

### Objetivo
Confirmar que Semana 4 realmente quedó cerrada.

### Prueba final obligatoria
1. entrar al sitio desplegado
2. registrarse como técnico o proveedor
3. iniciar sesión
4. mantener sesión activa
5. acceder a rutas privadas
6. cerrar sesión correctamente
7. verificar que la estructura base de datos quedó lista
8. verificar que el proyecto puede continuar a Semana 5

### Entregable final esperado
- ambiente técnico listo 100%
- frontend base operativo
- Supabase integrado
- auth operativa
- base de datos inicial creada
- storage listo
- deploy funcional

### Prompt sugerido para Codex
```text
Lee AGENTS.md y TASKS.md. Ejecuta únicamente la Fase 10.
Objetivo: validar el cierre real de la Semana 4.
Restricciones: no agregar nuevas features.
Done when: la prueba end-to-end confirma que el ambiente técnico quedó listo para Semana 5.
```

---

## Checklist maestro de cierre de Semana 4

- [x] Repo ordenado
- [x] AGENTS.md en raíz
- [x] TASKS.md en raíz
- [x] .codex/config.toml creado
- [x] Frontend base con React + TypeScript + Vite
- [x] Routing público y privado listo
- [x] Supabase integrado
- [x] Registro funcionando
- [x] Login funcionando
- [x] Logout funcionando
- [x] Persistencia de sesión funcionando
- [x] Rutas privadas protegidas
- [x] Esquema inicial de base de datos creado
- [x] RLS/políticas mínimas aplicadas
- [x] Storage para avatars listo
- [x] Deploy funcional
- [x] Validación end-to-end completada

---

## Orden recomendado de ejecución

Sigue este orden y no lo alteres salvo razón fuerte:

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6
8. Fase 7
9. Fase 8
10. Fase 9
11. Fase 10

---

## Regla final para Codex

Si una tarea parece demasiado grande, divídela antes de implementarla.

No intentes “adelantar” trabajo de Semana 5.

El objetivo de Semana 4 no es construir el producto completo.

El objetivo es dejar una base técnica estable, clara, segura y desplegable.
