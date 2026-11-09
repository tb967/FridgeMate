-- Let signed-in users read, save and remove their own recipes.
--
-- These grants were first added directly in the Supabase dashboard on
-- 6 Nov 2026 and are recorded here so the repo matches the database.
-- The existing row-level security policies still limit each user to
-- their own rows. No UPDATE: recipes and saved recipes are not edited
-- after saving. Signed-out visitors (anon) get nothing.
--
-- Applied to the hosted project on 9 Nov 2026 (version 20261109140958).

grant select, insert, delete on public.recipes to authenticated;
grant select, insert, delete on public.saved_recipes to authenticated;
