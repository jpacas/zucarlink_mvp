# Scripts de datos

Todos requieren `.env` o `.env.local` con `SUPABASE_URL` (o `VITE_SUPABASE_URL`) y
`SUPABASE_SERVICE_ROLE_KEY`. Nunca incrustar esas credenciales en el código ni
subirlas al repo (`.env*` ya está en `.gitignore`).

Todos corren en **dry-run por defecto** (solo reportan) y requieren `--execute`
para escribir/borrar de verdad.

## `migrate-legacy-users.mjs`

Migra los usuarios reales del respaldo MySQL legacy (Sequelize) hacia Supabase:
correo, contraseña (hash bcrypt original, sin resets), ingenio, país, cargo,
especialidad y experiencias. Descarta todo lo no personal del dump (foro,
maquinaria, ZucarIA, noticias, empleos, proveedores).

```
node scripts/migrate-legacy-users.mjs "<ruta-al-dump.sql>"              # dry-run
node scripts/migrate-legacy-users.mjs "<ruta-al-dump.sql>" --execute    # real
```

El dump contiene PII y hashes de contraseña: pásalo desde su ubicación externa,
nunca lo copies dentro del repo.

Antes de correr en real, revisa los mapeos editables al inicio del archivo:
`AREA_TO_SPECIALTY_SLUGS` (áreas legacy → `specialties.slug`) e
`INGENIO_NAME_OVERRIDES` (ingenios legacy → nombre final en `companies`).

Usuarios cuyo correo ya existe en Supabase se omiten y se reportan (no se
tocan). Las fotos de perfil reales (no genéricas) se migran desde su URL de S3
al bucket `avatars`; si la descarga falla, el usuario se crea igual sin foto.

## `cleanup-demo-data.mjs`

Borra los usuarios demo (`*@zucarlink.test`) sembrados por los scripts de
seed de las Semanas 5-9, y reporta empresas que quedaron sin ninguna
referencia para revisión manual.

```
node scripts/cleanup-demo-data.mjs              # dry-run
node scripts/cleanup-demo-data.mjs --execute    # real
```

Es independiente de `migrate-legacy-users.mjs`: puedes limpiar los datos demo
en el momento que decidas, antes o después de importar usuarios reales.

## `backfill-profile-status.mjs`

Recalcula `profiles.profile_status` para perfiles existentes marcados
`incomplete`, usando el criterio vigente (país presente => `complete`).
Útil si el criterio de "perfil completo" cambia después de haber migrado
usuarios, ya que las vistas públicas y privadas del directorio solo listan
perfiles con `profile_status = 'complete'`.

```
node scripts/backfill-profile-status.mjs              # dry-run
node scripts/backfill-profile-status.mjs --execute    # real
```
