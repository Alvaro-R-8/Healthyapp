-- Plan history: plans archived when a new one is imported or "Terminar plan"
-- is used, with the progress and notes they had. Run once in the Supabase
-- dashboard: SQL Editor → New query → paste → Run. Safe to run again.

create table if not exists plan_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  start_date date,
  end_date date,
  weeks int,
  total_sessions int,
  done_sessions int,
  data jsonb not null,
  completed jsonb not null default '{}'::jsonb,
  comments jsonb not null default '{}'::jsonb,
  archived_at timestamptz not null default now()
);

create index if not exists plan_history_user_idx on plan_history (user_id, archived_at desc);

alter table plan_history enable row level security;

drop policy if exists "Users manage their own plan history" on plan_history;
create policy "Users manage their own plan history"
  on plan_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
