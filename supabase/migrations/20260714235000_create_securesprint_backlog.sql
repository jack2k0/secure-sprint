create table public.team_members (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.backlog_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled backlog item' check (char_length(trim(title)) between 1 and 180),
  goal text,
  recipient_or_area text,
  description text,
  implementation_steps jsonb not null default '[]'::jsonb check (jsonb_typeof(implementation_steps) = 'array'),
  definition_of_done text,
  definition_of_done_checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(definition_of_done_checklist) = 'array'),
  assigned_to uuid references public.team_members (id) on delete set null,
  board_position text not null default 'draft' check (board_position in ('draft', 'refining', 'ready')),
  sort_order numeric not null default 0,
  created_by uuid not null references auth.users (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index backlog_stories_active_board_index
  on public.backlog_stories (board_position, sort_order, created_at desc)
  where archived_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger backlog_stories_set_updated_at
before update on public.backlog_stories
for each row execute function public.set_updated_at();

create or replace function public.create_team_member_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_creates_team_member
after insert on auth.users
for each row execute function public.create_team_member_for_new_user();

alter table public.team_members enable row level security;
alter table public.backlog_stories enable row level security;

create policy "authenticated users can read shared team members"
on public.team_members for select
to authenticated
using (true);

create policy "users can update their own team profile"
on public.team_members for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "authenticated users can read active workspace stories"
on public.backlog_stories for select
to authenticated
using (true);

create policy "authenticated users can create stories"
on public.backlog_stories for insert
to authenticated
with check (created_by = auth.uid());

create policy "authenticated users can update shared workspace stories"
on public.backlog_stories for update
to authenticated
using (true)
with check (true);
