-- Anti-dup log: делает check-prayers/daily-verse идемпотентными, даже если
-- внешний cron дёргает функцию чаще, чем раз в событие (была причина 5-10x дублей push).
create table if not exists notif_log (
  user_id    uuid not null,
  tag        text not null,
  sent_on    date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tag, sent_on)
);

alter table notif_log enable row level security;

-- Отдельные тумблеры для азкаров и "Аята дня", независимые от намаза.
alter table prayer_schedules
  add column if not exists azkar_notif_enabled  boolean not null default true,
  add column if not exists daily_verse_enabled   boolean not null default true;
