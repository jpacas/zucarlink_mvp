-- Pobla provider_categories con un catálogo base del sector azucarero.
-- Hasta ahora las categorías solo se insertaban desde scripts/seed-week9-providers.mjs,
-- que no corre en producción; por eso el select de categoría del onboarding salía vacío.
-- Idempotente: on conflict (slug) do nothing.

insert into public.provider_categories (slug, name) values
  ('automatizacion',     'Automatización y control'),
  ('instrumentacion',    'Instrumentación'),
  ('laboratorio',        'Laboratorio y análisis'),
  ('quimicos',           'Químicos e insumos de proceso'),
  ('equipos',            'Equipos y maquinaria'),
  ('repuestos',          'Repuestos y partes'),
  ('servicios-tecnicos', 'Servicios técnicos y mantenimiento'),
  ('energia',            'Energía y vapor'),
  ('agricola',           'Agrícola y riego')
on conflict (slug) do nothing;
