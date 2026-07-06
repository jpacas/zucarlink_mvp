create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  slug text not null unique,
  summary text not null,
  body text not null,
  category text not null,
  country text,
  source_name text,
  source_url text,
  cover_image_url text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_items_type_check check (type in ('news', 'blog')),
  constraint content_items_status_check check (status in ('draft', 'published'))
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  start_date date not null,
  end_date date,
  city text,
  country text,
  organizer text,
  source_url text,
  cover_image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_status_check check (status in ('draft', 'published'))
);

create table if not exists public.price_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  unit text,
  observed_at date not null,
  source_name text,
  source_url text,
  notes text,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint price_items_status_check check (status in ('draft', 'published'))
);

create index if not exists content_items_type_idx on public.content_items (type);
create index if not exists content_items_status_idx on public.content_items (status);
create index if not exists content_items_published_at_idx on public.content_items (published_at desc);
create index if not exists events_start_date_idx on public.events (start_date asc);
create index if not exists price_items_observed_at_idx on public.price_items (observed_at desc);

alter table public.content_items enable row level security;
alter table public.events enable row level security;
alter table public.price_items enable row level security;

drop policy if exists content_items_public_read on public.content_items;
create policy content_items_public_read
on public.content_items
for select
using (status = 'published');

drop policy if exists events_public_read on public.events;
create policy events_public_read
on public.events
for select
using (status = 'published');

drop policy if exists price_items_public_read on public.price_items;
create policy price_items_public_read
on public.price_items
for select
using (status = 'published');
