create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    account_type,
    full_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'account_type', 'technician'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    account_type = excluded.account_type,
    full_name = excluded.full_name,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (
  id,
  account_type,
  full_name
)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'account_type', 'technician'),
  coalesce(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1))
from auth.users as users
on conflict (id) do nothing;
