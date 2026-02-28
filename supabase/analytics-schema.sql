-- ============================================================
-- Channel Agent – Analytics Schema (optional optimisations)
-- ============================================================
-- Run this AFTER schema.sql to add analytics-specific views
-- and helper functions. The analytics API works without these
-- (it uses TypeScript aggregation), but these views are useful
-- for direct SQL querying and future optimisations.
-- ============================================================

-- ============================================================
-- VIEW: conversation_stats
-- Materialises message counts and engagement outcome per conversation.
-- ============================================================
create or replace view public.conversation_stats as
select
  c.id,
  c.user_id,
  c.persona_id,
  c.title,
  c.created_at,
  c.updated_at,
  count(m.id)::int                                              as message_count,
  case when count(m.id) >= 4 then 'engaged' else 'abandoned' end as outcome
from public.conversations c
left join public.messages m on m.conversation_id = c.id
group by c.id, c.user_id, c.persona_id, c.title, c.created_at, c.updated_at;

-- RLS note: this view inherits the security context of the caller.
-- The analytics API uses the service-role admin client which bypasses RLS.

-- ============================================================
-- FUNCTION: get_analytics_summary
-- Returns aggregated analytics as JSON for a given date range.
-- More efficient than fetching raw rows for large datasets.
-- ============================================================
create or replace function public.get_analytics_summary(
  p_start timestamptz,
  p_end   timestamptz
)
returns json
language plpgsql
security definer   -- runs as owner, bypasses RLS
as $$
declare
  v_result json;
begin
  with conv_stats as (
    select
      c.id,
      c.persona_id,
      c.user_id,
      c.created_at::date as conv_date,
      count(m.id)::int   as message_count
    from public.conversations c
    left join public.messages m on m.conversation_id = c.id
    where c.created_at >= p_start
      and c.created_at <  p_end
    group by c.id, c.persona_id, c.user_id, c.created_at
  ),
  daily as (
    select
      conv_date,
      count(*)::int           as conversations,
      coalesce(sum(message_count), 0)::int as messages
    from conv_stats
    group by conv_date
    order by conv_date
  ),
  personas as (
    select
      persona_id,
      count(*)::int as count
    from conv_stats
    group by persona_id
    order by count desc
  )
  select json_build_object(
    'total_conversations',    (select count(*) from conv_stats),
    'total_messages',         (select coalesce(sum(message_count), 0) from conv_stats),
    'active_users',           (select count(distinct user_id) from conv_stats),
    'engaged_conversations',  (select count(*) from conv_stats where message_count >= 4),
    'abandoned_conversations',(select count(*) from conv_stats where message_count < 4),
    'daily',                  coalesce((select json_agg(row_to_json(daily) order by daily.conv_date) from daily), '[]'::json),
    'by_persona',             coalesce((select json_agg(row_to_json(personas)) from personas), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

-- Allow authenticated users to call this function.
-- Admin check is enforced in the API route, not here.
grant execute on function public.get_analytics_summary to authenticated;

-- ============================================================
-- USAGE EXAMPLE (SQL editor)
-- ============================================================
-- select get_analytics_summary(
--   now() - interval '30 days',
--   now()
-- );
