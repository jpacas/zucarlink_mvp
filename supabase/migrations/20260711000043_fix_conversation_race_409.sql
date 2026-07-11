-- Fix: start_or_get_thread could raise a unique_violation (surfaced to the
-- client as an HTTP 409) when two concurrent calls both pass the "does the
-- conversation exist" check before either insert commits (double click, two
-- tabs, React StrictMode double-invoke). Catch the race and re-select instead
-- of letting it bubble up as a console error.
create or replace function public.start_or_get_thread(other_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  result_id       uuid;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para enviar mensajes.';
  end if;

  if other_profile_id = current_user_id then
    raise exception 'No puedes enviarte mensajes a ti mismo.';
  end if;

  -- Look for existing conversation (participants stored in either order)
  select id into result_id
  from public.conversations
  where (participant_one_id = current_user_id and participant_two_id = other_profile_id)
     or (participant_one_id = other_profile_id and participant_two_id = current_user_id)
  limit 1;

  if result_id is null then
    begin
      insert into public.conversations (participant_one_id, participant_two_id)
      values (current_user_id, other_profile_id)
      returning id into result_id;
    exception when unique_violation then
      -- Another concurrent call won the race; fetch the row it created.
      select id into result_id
      from public.conversations
      where (participant_one_id = current_user_id and participant_two_id = other_profile_id)
         or (participant_one_id = other_profile_id and participant_two_id = current_user_id)
      limit 1;
    end;
  end if;

  return result_id;
end;
$$;
