-- Минимальный write-only лог воронки регистрация → онбординг → первый home,
-- чтобы увидеть, на каком именно шаге отваливаются новые пользователи
-- (сейчас видно только last_sign_in_at vs created_at — не видно, что было внутри
-- первой сессии).
create table if not exists analytics_events (
  id         bigint generated always as identity primary key,
  session_id text not null,
  user_id    uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on analytics_events (event_name);
create index if not exists analytics_events_session_id_idx on analytics_events (session_id);
create index if not exists analytics_events_user_id_idx    on analytics_events (user_id);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at);

alter table analytics_events enable row level security;

-- Клиент пишет события и до входа (anon — на экране авторизации), и после (authenticated).
-- Чтения с клиента нет — только через дашборд/service_role, чтобы не светить чужую воронку.
create policy "insert own analytics events"
  on analytics_events for insert
  to anon, authenticated
  with check (true);
