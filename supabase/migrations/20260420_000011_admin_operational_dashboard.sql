create or replace function public.get_admin_operational_dashboard(period_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_period_days integer := least(greatest(coalesce(period_days, 30), 7), 365);
  period_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Auth requerida';
  end if;

  if coalesce(auth.jwt() -> 'user_metadata' ->> 'is_admin', 'false') <> 'true' then
    raise exception 'Permisos insuficientes';
  end if;

  period_start := timezone('utc', now()) - (clean_period_days || ' days')::interval;

  return jsonb_build_object(
    'period_days', clean_period_days,
    'generated_at', timezone('utc', now()),
    'kpis', jsonb_build_object(
      'new_users', (
        select count(*) from public.profiles where profiles.created_at >= period_start
      ),
      'technician_users', (
        select count(*) from public.profiles where profiles.account_type = 'technician'
      ),
      'provider_users', (
        select count(*) from public.profiles where profiles.account_type = 'provider'
      ),
      'complete_profiles', (
        select count(*) from public.profiles where profiles.profile_status = 'complete'
      ),
      'incomplete_profiles', (
        select count(*) from public.profiles where profiles.profile_status = 'incomplete'
      ),
      'verified_profiles', (
        select count(*) from public.profiles where profiles.verification_status = 'verified'
      ),
      'pending_profiles', (
        select count(*) from public.profiles where profiles.verification_status = 'pending'
      ),
      'forum_topics', (
        select count(*) from public.forum_topics where forum_topics.created_at >= period_start
      ),
      'forum_replies', (
        select count(*) from public.forum_replies where forum_replies.created_at >= period_start
      ),
      'active_providers', (
        select count(*) from public.providers where providers.status = 'active'
      ),
      'provider_leads', (
        select count(*) from public.provider_leads where provider_leads.created_at >= period_start
      ),
      'published_content', (
        (select count(*) from public.content_items where content_items.status = 'published')
        + (select count(*) from public.events where events.status = 'published')
        + (select count(*) from public.price_items where price_items.status = 'published')
      )
    ),
    'weekly_signups', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.week_start)
      from (
        select
          date_trunc('week', profiles.created_at)::date as week_start,
          count(*)::integer as user_count
        from public.profiles
        where profiles.created_at >= period_start
        group by 1
        order by 1
      ) rows
    ), '[]'::jsonb),
    'account_types', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.user_count desc, rows.account_type)
      from (
        select profiles.account_type, count(*)::integer as user_count
        from public.profiles
        group by profiles.account_type
      ) rows
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.user_count desc, rows.country)
      from (
        select coalesce(nullif(btrim(profiles.country), ''), 'Sin país') as country,
          count(*)::integer as user_count
        from public.profiles
        group by 1
        order by 2 desc, 1
        limit 10
      ) rows
    ), '[]'::jsonb),
    'companies', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.user_count desc, rows.company_name)
      from (
        select coalesce(companies.name, 'Sin empresa/ingenio') as company_name,
          count(*)::integer as user_count
        from public.profiles
        left join public.companies on companies.id = profiles.current_company_id
        group by 1
        order by 2 desc, 1
        limit 10
      ) rows
    ), '[]'::jsonb),
    'profile_statuses', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.user_count desc, rows.profile_status)
      from (
        select profiles.profile_status, count(*)::integer as user_count
        from public.profiles
        group by profiles.profile_status
      ) rows
    ), '[]'::jsonb),
    'verification_statuses', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.user_count desc, rows.verification_status)
      from (
        select profiles.verification_status, count(*)::integer as user_count
        from public.profiles
        group by profiles.verification_status
      ) rows
    ), '[]'::jsonb),
    'recent_users', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.created_at desc)
      from (
        select
          profiles.id,
          profiles.full_name,
          profiles.account_type,
          coalesce(profiles.country, '') as country,
          coalesce(companies.name, '') as company_name,
          profiles.profile_status,
          profiles.verification_status,
          profiles.created_at
        from public.profiles
        left join public.companies on companies.id = profiles.current_company_id
        order by profiles.created_at desc
        limit 8
      ) rows
    ), '[]'::jsonb),
    'forum_categories', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.reply_count desc, rows.topic_count desc)
      from (
        select
          forum_categories.name as category_name,
          coalesce(topic_metrics.topic_count, 0)::integer as topic_count,
          coalesce(reply_metrics.reply_count, 0)::integer as reply_count
        from public.forum_categories
        left join (
          select forum_topics.category_id, count(*)::integer as topic_count
          from public.forum_topics
          where forum_topics.created_at >= period_start
          group by forum_topics.category_id
        ) topic_metrics on topic_metrics.category_id = forum_categories.id
        left join (
          select forum_topics.category_id, count(forum_replies.id)::integer as reply_count
          from public.forum_replies
          join public.forum_topics on forum_topics.id = forum_replies.topic_id
          where forum_replies.created_at >= period_start
          group by forum_topics.category_id
        ) reply_metrics on reply_metrics.category_id = forum_categories.id
        where coalesce(topic_metrics.topic_count, 0) > 0
           or coalesce(reply_metrics.reply_count, 0) > 0
        order by 3 desc, 2 desc
        limit 10
      ) rows
    ), '[]'::jsonb),
    'recent_forum_topics', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.last_activity_at desc)
      from (
        select
          forum_topics.id,
          forum_topics.title,
          forum_categories.name as category_name,
          profiles.full_name as author_name,
          forum_topics.reply_count,
          coalesce(forum_topics.last_activity_at, forum_topics.created_at) as last_activity_at
        from public.forum_topics
        join public.forum_categories on forum_categories.id = forum_topics.category_id
        join public.profiles on profiles.id = forum_topics.author_id
        where forum_topics.created_at >= period_start
           or coalesce(forum_topics.last_activity_at, forum_topics.created_at) >= period_start
        order by coalesce(forum_topics.last_activity_at, forum_topics.created_at) desc
        limit 8
      ) rows
    ), '[]'::jsonb),
    'provider_statuses', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.provider_count desc, rows.status)
      from (
        select providers.status, count(*)::integer as provider_count
        from public.providers
        group by providers.status
      ) rows
    ), '[]'::jsonb),
    'provider_leads_by_provider', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.lead_count desc, rows.provider_name)
      from (
        select providers.company_name as provider_name, count(provider_leads.id)::integer as lead_count
        from public.provider_leads
        join public.providers on providers.id = provider_leads.provider_id
        where provider_leads.created_at >= period_start
        group by providers.company_name
        order by 2 desc, 1
        limit 10
      ) rows
    ), '[]'::jsonb),
    'recent_provider_leads', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.created_at desc)
      from (
        select
          provider_leads.id,
          providers.company_name as provider_name,
          provider_leads.name as lead_name,
          coalesce(provider_leads.company, '') as lead_company,
          provider_leads.status,
          provider_leads.created_at
        from public.provider_leads
        join public.providers on providers.id = provider_leads.provider_id
        where provider_leads.created_at >= period_start
        order by provider_leads.created_at desc
        limit 8
      ) rows
    ), '[]'::jsonb),
    'content_statuses', coalesce((
      select jsonb_agg(row_to_json(rows) order by rows.content_group, rows.status)
      from (
        select content_items.type as content_group, content_items.status, count(*)::integer as item_count
        from public.content_items
        group by content_items.type, content_items.status
        union all
        select 'events' as content_group, events.status, count(*)::integer as item_count
        from public.events
        group by events.status
        union all
        select 'prices' as content_group, price_items.status, count(*)::integer as item_count
        from public.price_items
        group by price_items.status
      ) rows
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_admin_operational_dashboard(integer) to authenticated;
