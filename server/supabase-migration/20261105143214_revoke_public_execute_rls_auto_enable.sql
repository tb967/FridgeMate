-- Stop rls_auto_enable() being callable through the API (/rest/v1/rpc).
-- The ensure_rls event trigger still fires it on CREATE TABLE, because
-- Postgres does not check EXECUTE when an event trigger runs its function.
--
-- Applied to the hosted project on 5 Nov 2026 (version 20261105143214).

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
