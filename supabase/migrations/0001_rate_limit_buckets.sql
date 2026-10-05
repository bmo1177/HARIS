-- Rate limiting for the HARIS edge functions.
--
-- The three functions (analyze-message, scenario-feedback, voice-debrief) are
-- publicly callable and each one triggers a billable LLM request. Before this
-- migration there was no quota of any kind, so the endpoint was an open meter.
--
-- Counters are stored here rather than in isolate memory: edge isolates are
-- short-lived and horizontally scaled, so an in-memory counter resets on every
-- cold start.

create table if not exists public.rate_limit_buckets (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0)
);

comment on table public.rate_limit_buckets is
  'Fixed-window request counters for edge function rate limiting. Housekeeping only; safe to purge.';

create index if not exists rate_limit_buckets_window_start_idx
  on public.rate_limit_buckets (window_start);

-- Row Level Security is enabled with no policies. That is deliberate: the
-- service role bypasses RLS, so the RPC below still works, while anon and
-- authenticated roles can neither read nor forge counters.
alter table public.rate_limit_buckets enable row level security;

-- Fixed-window counter. Atomically increments the counter for (key, window) and
-- returns the new value, which the caller compares against its limit.
--
-- Window start is derived from the epoch so that the same function serves both
-- the 60-second and the 86400-second window without a separate code path.
--
-- Note: two requests racing at an exact window rollover can both observe
-- count = 1, permitting one extra request per rollover per key. That is
-- immaterial for a per-minute and a per-day budget.
create or replace function public.bump_rate_limit(
  p_key text,
  p_window_seconds integer
)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_seconds integer := greatest(coalesce(p_window_seconds, 60), 1);
  v_bucket timestamptz := to_timestamp(
    floor(extract(epoch from now()) / v_seconds) * v_seconds
  );
  v_count integer;
begin
  insert into public.rate_limit_buckets as bucket (key, window_start, count)
  values (p_key, v_bucket, 1)
  on conflict (key) do update
    set count = case
                  when bucket.window_start < v_bucket then 1
                  else bucket.count + 1
                end,
        window_start = case
                         when bucket.window_start < v_bucket then v_bucket
                         else bucket.window_start
                       end
  returning count into v_count;

  return v_count;
end;
$$;

comment on function public.bump_rate_limit(text, integer) is
  'Atomically increments and returns the fixed-window counter for p_key.';

-- Locked down: only the service role (server-side edge functions) may call this.
revoke all on function public.bump_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.bump_rate_limit(text, integer) to service_role;
