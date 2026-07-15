-- Enable Realtime so open boards can subscribe to backlog_stories changes.
-- Polling GET /api/stories remains the reliable fallback if publication is unavailable.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'backlog_stories'
  ) then
    alter publication supabase_realtime add table public.backlog_stories;
  end if;
end
$$;
