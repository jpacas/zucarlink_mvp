alter table public.profiles
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists linkedin_url text,
  add column if not exists profile_status text not null default 'incomplete';

alter table public.profiles
  drop constraint if exists profiles_profile_status_check;

alter table public.profiles
  add constraint profiles_profile_status_check
  check (profile_status in ('incomplete', 'complete'));

alter table public.profiles
  drop constraint if exists profiles_verification_status_check;

alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('unverified', 'pending', 'verified'));

alter table public.experiences
  add column if not exists description text,
  add column if not exists achievements text;

insert into public.specialties (slug, name)
values
  ('campo', 'Campo'),
  ('cosecha', 'Cosecha'),
  ('riego', 'Riego'),
  ('recepcion-de-cana', 'Recepción de caña'),
  ('preparacion-de-cana', 'Preparación de caña'),
  ('molinos', 'Molinos'),
  ('calderas', 'Calderas'),
  ('energia', 'Energía'),
  ('evaporacion', 'Evaporación'),
  ('cristalizacion', 'Cristalización'),
  ('centrifugacion', 'Centrifugación'),
  ('calidad', 'Calidad'),
  ('laboratorio', 'Laboratorio'),
  ('automatizacion', 'Automatización'),
  ('instrumentacion', 'Instrumentación'),
  ('mantenimiento-mecanico', 'Mantenimiento mecánico'),
  ('mantenimiento-electrico', 'Mantenimiento eléctrico'),
  ('destileria-alcohol', 'Destilería / alcohol'),
  ('gestion-de-agua', 'Gestión de agua'),
  ('proyectos', 'Proyectos')
on conflict (slug) do update
set name = excluded.name;
