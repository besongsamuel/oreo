create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.zembra_fetch_call_logs (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies (id) on delete cascade,
    requested_by uuid references public.profiles (id) on delete set null,
    status text not null default 'pending' check (status in ('pending', 'success', 'error')),
    locations_processed integer,
    reviews_inserted integer,
    error_message text,
    triggered_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.zembra_fetch_call_logs is 'Tracks when the Zembra review fetch function is triggered for companies';

create index if not exists zembra_fetch_call_logs_company_id_idx
    on public.zembra_fetch_call_logs (company_id, triggered_at desc);

create trigger set_timestamp_before_update
    before update on public.zembra_fetch_call_logs
    for each row execute function public.set_current_timestamp_updated_at();

