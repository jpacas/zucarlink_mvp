create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  account_type text not null check (account_type in ('technician', 'provider')),
  full_name text not null,
  country text,
  role_title text,
  current_company_id uuid references public.companies (id) on delete set null,
  years_experience integer check (years_experience is null or years_experience >= 0),
  short_bio text,
  avatar_path text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profile_specialties (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  specialty_id uuid not null references public.specialties (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, specialty_id)
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  role_title text not null,
  summary text,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint experiences_dates_check
    check (end_date is null or end_date >= start_date)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references auth.users (id) on delete cascade,
  participant_two_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint conversations_distinct_participants_check
    check (participant_one_id <> participant_two_id)
);

create unique index if not exists conversations_unique_pair_idx
  on public.conversations (
    least(participant_one_id::text, participant_two_id::text),
    greatest(participant_one_id::text, participant_two_id::text)
  );

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories (id) on delete restrict,
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  company_name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provider_leads (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_current_company_id_idx
  on public.profiles (current_company_id);

create index if not exists experiences_profile_id_idx
  on public.experiences (profile_id);

create index if not exists experiences_company_id_idx
  on public.experiences (company_id);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create index if not exists forum_topics_category_id_idx
  on public.forum_topics (category_id);

create index if not exists forum_topics_author_id_idx
  on public.forum_topics (author_id);

create index if not exists forum_replies_topic_id_idx
  on public.forum_replies (topic_id);

create index if not exists forum_replies_author_id_idx
  on public.forum_replies (author_id);

create index if not exists providers_owner_id_idx
  on public.providers (owner_id);

create index if not exists provider_leads_provider_id_idx
  on public.provider_leads (provider_id);

create index if not exists provider_leads_requester_id_idx
  on public.provider_leads (requester_id);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists experiences_set_updated_at on public.experiences;
create trigger experiences_set_updated_at
before update on public.experiences
for each row
execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();

drop trigger if exists forum_categories_set_updated_at on public.forum_categories;
create trigger forum_categories_set_updated_at
before update on public.forum_categories
for each row
execute function public.set_updated_at();

drop trigger if exists forum_topics_set_updated_at on public.forum_topics;
create trigger forum_topics_set_updated_at
before update on public.forum_topics
for each row
execute function public.set_updated_at();

drop trigger if exists forum_replies_set_updated_at on public.forum_replies;
create trigger forum_replies_set_updated_at
before update on public.forum_replies
for each row
execute function public.set_updated_at();

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
before update on public.providers
for each row
execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.profile_specialties enable row level security;
alter table public.experiences enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.forum_categories enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;
alter table public.providers enable row level security;
alter table public.provider_leads enable row level security;

drop policy if exists companies_public_read on public.companies;
create policy companies_public_read
on public.companies
for select
using (true);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists specialties_public_read on public.specialties;
create policy specialties_public_read
on public.specialties
for select
using (true);

drop policy if exists profile_specialties_select_own on public.profile_specialties;
create policy profile_specialties_select_own
on public.profile_specialties
for select
using (auth.uid() = profile_id);

drop policy if exists profile_specialties_insert_own on public.profile_specialties;
create policy profile_specialties_insert_own
on public.profile_specialties
for insert
with check (auth.uid() = profile_id);

drop policy if exists profile_specialties_delete_own on public.profile_specialties;
create policy profile_specialties_delete_own
on public.profile_specialties
for delete
using (auth.uid() = profile_id);

drop policy if exists experiences_select_own on public.experiences;
create policy experiences_select_own
on public.experiences
for select
using (auth.uid() = profile_id);

drop policy if exists experiences_insert_own on public.experiences;
create policy experiences_insert_own
on public.experiences
for insert
with check (auth.uid() = profile_id);

drop policy if exists experiences_update_own on public.experiences;
create policy experiences_update_own
on public.experiences
for update
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists experiences_delete_own on public.experiences;
create policy experiences_delete_own
on public.experiences
for delete
using (auth.uid() = profile_id);

drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant
on public.conversations
for select
using (auth.uid() in (participant_one_id, participant_two_id));

drop policy if exists conversations_insert_participant on public.conversations;
create policy conversations_insert_participant
on public.conversations
for insert
with check (auth.uid() in (participant_one_id, participant_two_id));

drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant
on public.messages
for select
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.participant_one_id, conversations.participant_two_id)
  )
);

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender
on public.messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and auth.uid() in (conversations.participant_one_id, conversations.participant_two_id)
  )
);

drop policy if exists forum_categories_public_read on public.forum_categories;
create policy forum_categories_public_read
on public.forum_categories
for select
using (true);

drop policy if exists forum_topics_public_read on public.forum_topics;
create policy forum_topics_public_read
on public.forum_topics
for select
using (true);

drop policy if exists forum_topics_insert_authenticated on public.forum_topics;
create policy forum_topics_insert_authenticated
on public.forum_topics
for insert
with check (auth.uid() = author_id);

drop policy if exists forum_topics_update_author on public.forum_topics;
create policy forum_topics_update_author
on public.forum_topics
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists forum_topics_delete_author on public.forum_topics;
create policy forum_topics_delete_author
on public.forum_topics
for delete
using (auth.uid() = author_id);

drop policy if exists forum_replies_public_read on public.forum_replies;
create policy forum_replies_public_read
on public.forum_replies
for select
using (true);

drop policy if exists forum_replies_insert_authenticated on public.forum_replies;
create policy forum_replies_insert_authenticated
on public.forum_replies
for insert
with check (auth.uid() = author_id);

drop policy if exists forum_replies_update_author on public.forum_replies;
create policy forum_replies_update_author
on public.forum_replies
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists forum_replies_delete_author on public.forum_replies;
create policy forum_replies_delete_author
on public.forum_replies
for delete
using (auth.uid() = author_id);

drop policy if exists providers_public_read on public.providers;
create policy providers_public_read
on public.providers
for select
using (true);

drop policy if exists providers_insert_owner on public.providers;
create policy providers_insert_owner
on public.providers
for insert
with check (auth.uid() = owner_id);

drop policy if exists providers_update_owner on public.providers;
create policy providers_update_owner
on public.providers
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists providers_delete_owner on public.providers;
create policy providers_delete_owner
on public.providers
for delete
using (auth.uid() = owner_id);

drop policy if exists provider_leads_select_participants on public.provider_leads;
create policy provider_leads_select_participants
on public.provider_leads
for select
using (
  auth.uid() = requester_id
  or exists (
    select 1
    from public.providers
    where providers.id = provider_leads.provider_id
      and providers.owner_id = auth.uid()
  )
);

drop policy if exists provider_leads_insert_requester on public.provider_leads;
create policy provider_leads_insert_requester
on public.provider_leads
for insert
with check (auth.uid() = requester_id);
