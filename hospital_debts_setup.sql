-- hospital_debts_setup.sql
-- Supabase/PostgreSQL migration for government medical-center debt claims.
-- Run auth_setup.sql first so public.system_users exists.
-- Financial records are private: authenticated company accounts see only their assigned company;
-- organization/admin accounts can review all rows. Never use the service_role key in a browser.

create extension if not exists pgcrypto;

-- Link authenticated Supabase accounts to the exact distributor_name used by hospital_debts.html.
-- Provision mappings only from a trusted SQL editor or service-role backend.
create table if not exists public.government_center_debt_company_access (
    user_id uuid not null references auth.users(id) on delete cascade,
    distributor_name text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, distributor_name)
);

create or replace function public.hcd_is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
    select exists (
        select 1 from public.system_users u
        where u.id = auth.uid() and u.active
          and u.role::text in ('organization', 'admin')
    );
$$;

create or replace function public.hcd_owns_company(p_distributor_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
    select exists (
        select 1 from public.government_center_debt_company_access a
        where a.user_id = auth.uid() and a.distributor_name = p_distributor_name
    );
$$;

revoke all on function public.hcd_is_reviewer() from public;
revoke all on function public.hcd_owns_company(text) from public;
grant execute on function public.hcd_is_reviewer() to authenticated;
grant execute on function public.hcd_owns_company(text) to authenticated;

create table if not exists public.government_center_debts (
    id uuid primary key default gen_random_uuid(),
    distributor_id uuid,
    distributor_name text not null check (length(btrim(distributor_name)) > 0),
    medical_center_name text not null check (length(btrim(medical_center_name)) > 0),
    center_type text not null check (center_type in ('university_hospital','social_security','health_network')),
    invoice_no text not null check (length(btrim(invoice_no)) > 0),
    claim_amount numeric(18,2) not null check (claim_amount >= 0),
    balance_amount numeric(18,2) not null check (balance_amount >= 0 and balance_amount <= claim_amount),
    invoice_date date,
    due_date date not null,
    status text not null default 'active'
        check (status in ('active','partially_paid','settled','disputed')),
    -- Store a document reference only. For confidential files use a private Storage bucket
    -- and short-lived signed URLs; this text field alone does not secure a public URL.
    doc_url text,
    notes text,
    created_by uuid references auth.users(id) on delete set null default auth.uid(),
    updated_by uuid references auth.users(id) on delete set null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint hcd_settled_balance_zero check (status <> 'settled' or balance_amount = 0)
);

create index if not exists idx_gcd_distributor_due_date
    on public.government_center_debts (distributor_name, due_date);
create index if not exists idx_gcd_center on public.government_center_debts (medical_center_name);
create index if not exists idx_gcd_status on public.government_center_debts (status);
create index if not exists idx_gcd_due_date on public.government_center_debts (due_date);

create or replace function public.hcd_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at := now();
    new.updated_by := auth.uid();
    return new;
end;
$$;

drop trigger if exists trg_gcd_set_updated_at on public.government_center_debts;
create trigger trg_gcd_set_updated_at
    before update on public.government_center_debts
    for each row execute function public.hcd_set_updated_at();

alter table public.government_center_debts enable row level security;
alter table public.government_center_debt_company_access enable row level security;

-- Company mapping is deliberately not client-readable/writable. Provision it through trusted admin tooling.
revoke all on public.government_center_debt_company_access from anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on public.government_center_debts to authenticated;
revoke all on public.government_center_debts from anon;

drop policy if exists gcd_select_assigned_or_reviewer on public.government_center_debts;
create policy gcd_select_assigned_or_reviewer
    on public.government_center_debts for select to authenticated
    using (public.hcd_is_reviewer() or public.hcd_owns_company(distributor_name));

drop policy if exists gcd_insert_assigned_or_reviewer on public.government_center_debts;
create policy gcd_insert_assigned_or_reviewer
    on public.government_center_debts for insert to authenticated
    with check (public.hcd_is_reviewer() or public.hcd_owns_company(distributor_name));

drop policy if exists gcd_update_assigned_or_reviewer on public.government_center_debts;
create policy gcd_update_assigned_or_reviewer
    on public.government_center_debts for update to authenticated
    using (public.hcd_is_reviewer() or public.hcd_owns_company(distributor_name))
    with check (public.hcd_is_reviewer() or public.hcd_owns_company(distributor_name));

comment on table public.government_center_debts is
    'Financial claims by distributors against government medical centers; access is restricted by RLS.';
comment on column public.government_center_debts.doc_url is
    'Document reference; use private Supabase Storage and signed URLs for confidential financial documents.';
comment on table public.government_center_debt_company_access is
    'Trusted mapping from authenticated user IDs to distributor names for debt-row access.';

-- Example provisioning (replace UUID with an existing auth.users.id; run as trusted administrator):
-- insert into public.government_center_debt_company_access (user_id, distributor_name)
-- values ('00000000-0000-0000-0000-000000000000', 'پخش هجرت');
-- Reviewer accounts need public.system_users.role = 'organization' or 'admin' and active = true.
-- End of migration.
