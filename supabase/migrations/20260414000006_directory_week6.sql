create or replace function public.get_public_directory_summary()
returns table (
  total_members bigint,
  total_countries bigint,
  total_companies bigint,
  total_specialties bigint
)
language sql
security definer
set search_path = public
as $$
  with visible_profiles as (
    select
      profiles.id,
      profiles.country,
      profiles.current_company_id
    from public.profiles
    where profiles.account_type = 'technician'
      and profiles.profile_status = 'complete'
  )
  select
    count(*)::bigint as total_members,
    count(distinct nullif(trim(country), ''))::bigint as total_countries,
    count(distinct current_company_id)::bigint as total_companies,
    (
      select count(distinct profile_specialties.specialty_id)::bigint
      from public.profile_specialties
      join visible_profiles on visible_profiles.id = profile_specialties.profile_id
    ) as total_specialties
  from visible_profiles;
$$;

create or replace function public.search_directory_profiles(
  search_text text default null,
  country_filter text default null,
  specialty_slug_filter text default null
)
returns table (
  id uuid,
  full_name text,
  role_title text,
  organization_name text,
  country text,
  short_bio text,
  avatar_path text,
  specialties text[],
  verification_status text
)
language sql
security definer
set search_path = public
as $$
  with visible_profiles as (
    select
      profiles.id,
      profiles.full_name,
      profiles.role_title,
      profiles.country,
      profiles.short_bio,
      profiles.avatar_path,
      profiles.verification_status,
      companies.name as organization_name
    from public.profiles
    left join public.companies on companies.id = profiles.current_company_id
    where profiles.account_type = 'technician'
      and profiles.profile_status = 'complete'
  ),
  profile_specialty_names as (
    select
      profile_specialties.profile_id,
      array_agg(specialties.name order by specialties.name) as specialties,
      string_agg(lower(specialties.slug), ' ') as specialty_slugs,
      string_agg(lower(specialties.name), ' ') as specialty_names
    from public.profile_specialties
    join public.specialties on specialties.id = profile_specialties.specialty_id
    group by profile_specialties.profile_id
  )
  select
    visible_profiles.id,
    visible_profiles.full_name,
    visible_profiles.role_title,
    visible_profiles.organization_name,
    visible_profiles.country,
    visible_profiles.short_bio,
    visible_profiles.avatar_path,
    coalesce(profile_specialty_names.specialties, '{}') as specialties,
    visible_profiles.verification_status
  from visible_profiles
  left join profile_specialty_names on profile_specialty_names.profile_id = visible_profiles.id
  where (
    nullif(trim(search_text), '') is null
    or lower(
      concat_ws(
        ' ',
        visible_profiles.full_name,
        coalesce(visible_profiles.organization_name, ''),
        coalesce(profile_specialty_names.specialty_names, '')
      )
    ) like '%' || lower(trim(search_text)) || '%'
  )
    and (
      nullif(trim(country_filter), '') is null
      or lower(coalesce(visible_profiles.country, '')) = lower(trim(country_filter))
    )
    and (
      nullif(trim(specialty_slug_filter), '') is null
      or coalesce(profile_specialty_names.specialty_slugs, '') like '%' || lower(trim(specialty_slug_filter)) || '%'
    )
  order by
    case visible_profiles.verification_status
      when 'verified' then 0
      when 'pending' then 1
      else 2
    end,
    visible_profiles.full_name asc;
$$;

create or replace function public.get_directory_profile_detail(profile_id uuid)
returns table (
  id uuid,
  full_name text,
  role_title text,
  organization_name text,
  country text,
  years_experience integer,
  short_bio text,
  avatar_path text,
  specialties text[],
  verification_status text,
  experiences jsonb
)
language sql
security definer
set search_path = public
as $$
  with target_profile as (
    select
      profiles.id,
      profiles.full_name,
      profiles.role_title,
      profiles.country,
      profiles.years_experience,
      profiles.short_bio,
      profiles.avatar_path,
      profiles.verification_status,
      companies.name as organization_name
    from public.profiles
    left join public.companies on companies.id = profiles.current_company_id
    where profiles.id = profile_id
      and profiles.account_type = 'technician'
      and profiles.profile_status = 'complete'
  ),
  specialty_data as (
    select
      profile_specialties.profile_id,
      array_agg(specialties.name order by specialties.name) as specialties
    from public.profile_specialties
    join public.specialties on specialties.id = profile_specialties.specialty_id
    where profile_specialties.profile_id = profile_id
    group by profile_specialties.profile_id
  ),
  experience_data as (
    select
      experiences.profile_id,
      jsonb_agg(
        jsonb_build_object(
          'id', experiences.id,
          'companyName', coalesce(companies.name, ''),
          'roleTitle', experiences.role_title,
          'startDate', experiences.start_date,
          'endDate', experiences.end_date,
          'isCurrent', experiences.is_current,
          'description', coalesce(experiences.description, ''),
          'achievements', coalesce(experiences.achievements, '')
        )
        order by experiences.start_date desc
      ) as experiences
    from public.experiences
    left join public.companies on companies.id = experiences.company_id
    where experiences.profile_id = profile_id
    group by experiences.profile_id
  )
  select
    target_profile.id,
    target_profile.full_name,
    target_profile.role_title,
    target_profile.organization_name,
    target_profile.country,
    target_profile.years_experience,
    target_profile.short_bio,
    target_profile.avatar_path,
    coalesce(specialty_data.specialties, '{}') as specialties,
    target_profile.verification_status,
    coalesce(experience_data.experiences, '[]'::jsonb) as experiences
  from target_profile
  left join specialty_data on specialty_data.profile_id = target_profile.id
  left join experience_data on experience_data.profile_id = target_profile.id;
$$;

revoke all on function public.get_public_directory_summary() from public;
grant execute on function public.get_public_directory_summary() to anon, authenticated;

revoke all on function public.search_directory_profiles(text, text, text) from public;
grant execute on function public.search_directory_profiles(text, text, text) to authenticated;

revoke all on function public.get_directory_profile_detail(uuid) from public;
grant execute on function public.get_directory_profile_detail(uuid) to authenticated;
