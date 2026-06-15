-- ═══════════════════════════════════════════════════════════
-- Nur Hayat — полная схема БД (Frankfurt EU)
-- Запустить в SQL Editor нового проекта nur-hayat-eu
-- ═══════════════════════════════════════════════════════════

-- ── 1. PROFILES ─────────────────────────────────────────────
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text not null default '',
  email            text not null default '',
  language         text not null default 'ru',
  translation_id   int  not null default 131,
  level            text not null default 'seeker',
  gender           text,
  nur              int  not null default 10,
  streak           int  not null default 1,
  onboarded        boolean not null default false,
  avatar_url       text,
  progress         jsonb,
  created_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── 2. MESSAGES ─────────────────────────────────────────────
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  room        text not null default 'general',
  text        text,
  reply_to    jsonb,
  media_url   text,
  media_type  text,
  duration    int,
  reactions   jsonb,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Authenticated users can read messages"
  on public.messages for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

create policy "Users can update own messages"
  on public.messages for update
  using (auth.uid() = user_id);

create policy "Users can delete own messages"
  on public.messages for delete
  using (auth.uid() = user_id);

create index if not exists messages_room_created_idx on public.messages(room, created_at desc);

-- ── 3. CHAT_READS ────────────────────────────────────────────
create table if not exists public.chat_reads (
  user_id     uuid not null references auth.users(id) on delete cascade,
  room        text not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, room)
);

alter table public.chat_reads enable row level security;

create policy "Users can manage own chat reads"
  on public.chat_reads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Нужно для онлайн-счётчика и read-receipts: видеть отметки других
-- пользователей, не только свою (запись/изменение всё равно только своей).
create policy "Authenticated users can read chat reads"
  on public.chat_reads for select
  using (auth.role() = 'authenticated');

-- ── 4. NOTES ────────────────────────────────────────────────
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  body        text,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can manage own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 5. GOALS ────────────────────────────────────────────────
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  description text,
  is_done     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Users can manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 6. PRAYER_LOGS ──────────────────────────────────────────
create table if not exists public.prayer_logs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       text not null,
  prayer     text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date, prayer)
);

alter table public.prayer_logs enable row level security;

create policy "Users can manage own prayer logs"
  on public.prayer_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 7. PRAYER_SCHEDULES ─────────────────────────────────────
create table if not exists public.prayer_schedules (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  date          text,
  timings       jsonb,
  remind_before int,
  utc_offset    int,
  updated_at    timestamptz not null default now()
);

alter table public.prayer_schedules enable row level security;

create policy "Users can manage own prayer schedules"
  on public.prayer_schedules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 8. LIKED_VERSES ─────────────────────────────────────────
create table if not exists public.liked_verses (
  user_id    uuid not null references auth.users(id) on delete cascade,
  verse_key  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, verse_key)
);

alter table public.liked_verses enable row level security;

create policy "Users can manage own liked verses"
  on public.liked_verses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 9. STORAGE: chat-media ───────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media', 'chat-media', true,
  10485760,  -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/ogg','audio/mpeg','video/mp4']
)
on conflict (id) do nothing;

create policy "Authenticated users can upload media"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

create policy "Anyone can view media"
  on storage.objects for select
  using (bucket_id = 'chat-media');

create policy "Users can delete own media"
  on storage.objects for delete
  using (bucket_id = 'chat-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Realtime для messages ────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_reads;
