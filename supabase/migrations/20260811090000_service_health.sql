-- Состояние внешних зависимостей для сторожа (функция watchdog).
-- Нужна, чтобы отличать "лежит уже час" от "только что упало": без памяти
-- сторож либо молчал бы о повторных проблемах, либо слал бы письмо каждые
-- 5 минут, пока авария не устранена.
create table if not exists service_health (
  service       text primary key,
  is_down       boolean     not null default false,
  changed_at    timestamptz not null default now(),
  last_alert_at timestamptz
);

-- Таблица чисто служебная: читает и пишет только сама функция под
-- service_role. RLS включён без единой политики — значит для anon и
-- authenticated доступа нет вообще.
alter table service_health enable row level security;
