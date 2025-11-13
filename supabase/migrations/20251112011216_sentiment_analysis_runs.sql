create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.sentiment_analysis_runs (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies (id) on delete cascade,
    triggered_by uuid references public.profiles (id) on delete set null,
    status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'failed')),
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    total_reviews integer not null default 0,
    processed_reviews integer not null default 0,
    skipped_reviews integer not null default 0,
    failed_reviews integer not null default 0,
    error_details text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.sentiment_analysis_runs is 'Tracks sentiment analysis job executions for companies';

create index if not exists sentiment_analysis_runs_company_id_started_at_idx
    on public.sentiment_analysis_runs (company_id, started_at desc);

create trigger sentiment_analysis_runs_set_timestamp
    before update on public.sentiment_analysis_runs
    for each row execute function public.set_current_timestamp_updated_at();

alter table public.sentiment_analysis_runs enable row level security;

drop policy if exists sentiment_analysis_runs_admin_read on public.sentiment_analysis_runs;
create policy sentiment_analysis_runs_admin_read
    on public.sentiment_analysis_runs
    for select
    to authenticated
    using (is_admin(auth.uid()));


