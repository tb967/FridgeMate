-- FridgeMate baseline schema
--
-- Snapshot of the public schema as it existed in the Supabase project
-- "FridgeMate" (blyyathwzgsgburzcurw) on 5 Nov 2026, before any migrations
-- were tracked. The tables were originally created in the dashboard.
--
-- This migration is already reflected in the hosted project. Do NOT run it
-- there again; mark it as applied instead:
--   supabase migration repair --status applied 20261105000000

-- ---------------------------------------------------------------------------
-- Auto-enable row-level security on every new table in public
-- ---------------------------------------------------------------------------

create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  cmd record;
  tbl name;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null
       and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog', 'information_schema')
       and cmd.schema_name not like 'pg_toast%'
       and cmd.schema_name not like 'pg_temp%' then
      begin
        select c.relname into tbl from pg_catalog.pg_class c where c.oid = cmd.objid;
        execute format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$function$;

create event trigger ensure_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.inventory_items (
  id          uuid          not null default gen_random_uuid(),
  user_id     uuid          not null,
  name        text          not null,
  quantity    numeric(10,2) not null default 1,
  unit        text          not null default 'item'::text,
  category    text,
  expiry_date date,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),
  constraint inventory_items_pkey primary key (id),
  constraint inventory_items_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint inventory_items_quantity_check check (quantity > (0)::numeric)
);

create index inventory_items_user_id_idx on public.inventory_items using btree (user_id);
create index inventory_items_expiry_date_idx on public.inventory_items using btree (user_id, expiry_date);

create table public.recipes (
  id                   uuid          not null default gen_random_uuid(),
  user_id              uuid          not null,
  title                text          not null,
  description          text,
  ingredients          jsonb         not null default '[]'::jsonb,
  instructions         jsonb         not null default '[]'::jsonb,
  cooking_time_minutes integer,
  calories             numeric(10,2),
  protein_g            numeric(10,2),
  carbohydrates_g      numeric(10,2),
  fat_g                numeric(10,2),
  created_at           timestamptz   not null default now(),
  constraint recipes_pkey primary key (id),
  constraint recipes_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint recipes_cooking_time_minutes_check
    check ((cooking_time_minutes is null) or (cooking_time_minutes > 0))
);

create index recipes_user_id_idx on public.recipes using btree (user_id);

create table public.saved_recipes (
  id        uuid        not null default gen_random_uuid(),
  user_id   uuid        not null,
  recipe_id uuid        not null,
  saved_at  timestamptz not null default now(),
  constraint saved_recipes_pkey primary key (id),
  constraint saved_recipes_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint saved_recipes_recipe_id_fkey foreign key (recipe_id)
    references public.recipes (id) on delete cascade,
  constraint saved_recipes_user_id_recipe_id_key unique (user_id, recipe_id)
);

create index saved_recipes_user_id_idx on public.saved_recipes using btree (user_id);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.inventory_items enable row level security;
alter table public.recipes         enable row level security;
alter table public.saved_recipes   enable row level security;

create policy "Users manage their own inventory"
  on public.inventory_items
  as permissive
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own recipes"
  on public.recipes
  as permissive
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own saved recipes"
  on public.saved_recipes
  as permissive
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.recipes
      where recipes.id = saved_recipes.recipe_id
        and recipes.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Table privileges, exactly as they stand in the hosted project
-- ---------------------------------------------------------------------------
-- Supabase grants everything to anon, authenticated and service_role by
-- default. The hosted project has narrower grants, reproduced here.
--
-- NOTE: authenticated currently has no SELECT/INSERT/UPDATE/DELETE on
-- recipes or saved_recipes, so the app cannot read or save recipes yet.
-- Fix that in a later migration rather than here, so this file stays a
-- faithful snapshot.

revoke all on public.inventory_items from anon, authenticated, service_role;
revoke all on public.recipes         from anon, authenticated, service_role;
revoke all on public.saved_recipes   from anon, authenticated, service_role;

grant references, trigger, truncate on public.inventory_items to anon, service_role;
grant select, insert, update, delete, references, trigger, truncate
  on public.inventory_items to authenticated;

grant references, trigger, truncate on public.recipes       to anon, authenticated, service_role;
grant references, trigger, truncate on public.saved_recipes to anon, authenticated, service_role;
