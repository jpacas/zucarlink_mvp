-- T14: mecanismo de referidos entre técnicos. Un técnico tiene un único
-- código de invitación (creado on-demand, no en el signup); cuando alguien
-- se registra con ese código en la URL, queda una fila de "canje" — nunca más
-- de una por persona referida (constraint unique en referred_id).
--
-- Guard anti-auto-referido + código inválido: ambos casos devuelven false
-- desde el RPC de canje sin lanzar excepción — el signup nunca debe fallar ni
-- mostrar error por un código de referido roto o propio (ver verify de T14).

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.referral_codes (code) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists referral_redemptions_code_idx on public.referral_redemptions (code);

-- Sin políticas de RLS para anon/authenticated: solo los RPC security
-- definer de abajo las tocan.
alter table public.referral_codes enable row level security;
alter table public.referral_redemptions enable row level security;

create or replace function public.get_my_referral_summary()
returns table (code text, redemption_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Auth requerida.';
  end if;

  select referral_codes.code into v_code
  from public.referral_codes
  where profile_id = auth.uid();

  if v_code is null then
    loop
      -- 10 chars hex de un UUIDv4 real = 40 bits de entropía; suficiente
      -- para un código de invitación no adivinable (no es un secreto
      -- criptográfico, es un link para compartir).
      v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      exit when not exists (select 1 from public.referral_codes where referral_codes.code = v_code);
    end loop;

    insert into public.referral_codes (profile_id, code)
    values (auth.uid(), v_code)
    on conflict (profile_id) do update set code = referral_codes.code
    returning referral_codes.code into v_code;
  end if;

  return query
  select v_code, count(rr.id)::integer
  from public.referral_redemptions rr
  where rr.code = v_code;
end;
$$;

-- Se llama justo después de auth.signUp(), ANTES de que exista sesión si el
-- flujo requiere confirmación de email — por eso recibe p_referred_id
-- explícito en vez de usar auth.uid(). Ventana de 10 minutos desde la
-- creación del perfil referido acota el abuso de "reclamar" cuentas viejas
-- ajenas con un p_referred_id adivinado.
create or replace function public.redeem_referral_code(p_code text, p_referred_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
begin
  if p_code is null or p_referred_id is null then
    return false;
  end if;

  select profile_id into v_referrer_id
  from public.referral_codes
  where code = upper(trim(p_code));

  if v_referrer_id is null then
    return false;
  end if;

  if v_referrer_id = p_referred_id then
    return false;
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_referred_id
      and created_at > timezone('utc', now()) - interval '10 minutes'
  ) then
    return false;
  end if;

  insert into public.referral_redemptions (code, referrer_id, referred_id)
  values (upper(trim(p_code)), v_referrer_id, p_referred_id)
  on conflict (referred_id) do nothing;

  return found;
end;
$$;

revoke all on function public.get_my_referral_summary() from public;
revoke all on function public.redeem_referral_code(text, uuid) from public;

grant execute on function public.get_my_referral_summary() to authenticated;
grant execute on function public.redeem_referral_code(text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
