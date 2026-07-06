-- Mejoras al módulo de proveedores:
--  1. Bandeja de leads: RPCs para que un proveedor liste y gestione sus propias
--     solicitudes de contacto (la tabla provider_leads y su columna status ya existen).
--  2. Carga de logo: bucket público provider-logos + columna logo_path en providers
--     para poder limpiar el archivo anterior al reemplazarlo (logo_url sigue sirviendo
--     la URL pública directa, igual que avatars).

-- 1) Bandeja de leads -------------------------------------------------------

-- Lista los leads de los proveedores cuyo owner es el usuario autenticado.
create or replace function public.list_provider_leads()
returns table (
  id uuid,
  provider_id uuid,
  name text,
  email text,
  company text,
  message text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    provider_leads.id,
    provider_leads.provider_id,
    provider_leads.name,
    provider_leads.email,
    provider_leads.company,
    provider_leads.message,
    provider_leads.status,
    provider_leads.created_at
  from public.provider_leads
  join public.providers
    on providers.id = provider_leads.provider_id
  where providers.owner_id = auth.uid()
  order by provider_leads.created_at desc;
$$;

-- Cambia el estado de un lead, validando que pertenezca a un proveedor del usuario
-- y que el nuevo estado esté dentro del CHECK existente (new|reviewed|contacted|closed).
create or replace function public.update_provider_lead_status(
  lead_id uuid,
  next_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if next_status not in ('new', 'reviewed', 'contacted', 'closed') then
    raise exception 'Estado de lead inválido';
  end if;

  if not exists (
    select 1
    from public.provider_leads
    join public.providers
      on providers.id = provider_leads.provider_id
    where provider_leads.id = lead_id
      and providers.owner_id = auth.uid()
  ) then
    raise exception 'Lead no disponible';
  end if;

  update public.provider_leads
  set status = next_status
  where id = lead_id;
end;
$$;

grant execute on function public.list_provider_leads() to authenticated;
grant execute on function public.update_provider_lead_status(uuid, text) to authenticated;

-- 2) Carga de logo ----------------------------------------------------------

alter table public.providers
  add column if not exists logo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-logos',
  'provider-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública (el bucket alimenta el directorio y el detalle público).
drop policy if exists provider_logos_public_read on storage.objects;
create policy provider_logos_public_read
on storage.objects
for select
using (bucket_id = 'provider-logos');

-- Escrituras acotadas al dueño de la carpeta ({userId}/...).
drop policy if exists provider_logos_insert_own on storage.objects;
create policy provider_logos_insert_own
on storage.objects
for insert
with check (
  bucket_id = 'provider-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists provider_logos_update_own on storage.objects;
create policy provider_logos_update_own
on storage.objects
for update
using (
  bucket_id = 'provider-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'provider-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists provider_logos_delete_own on storage.objects;
create policy provider_logos_delete_own
on storage.objects
for delete
using (
  bucket_id = 'provider-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
