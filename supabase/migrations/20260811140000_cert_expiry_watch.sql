-- Дата истечения SSL-сертификата прокси, чтобы сторож предупреждал заранее.
--
-- Сейчас он ловит аварию по факту: сертификат сломался, приложение отвалилось,
-- пришёл push. Это лучше, чем узнавать от пользователей, но всё равно уже
-- после поломки. Зная дату, можно написать за две недели.
--
-- Дату приходится хранить, а не вычитывать из сертификата: среда, в которой
-- работают edge-функции, не отдаёт подробности TLS-соединения. Обновляется
-- она после каждого продления — вызовом watchdog с телом {"certExpiresOn":...}.
alter table service_health
  add column if not exists expires_on date;

insert into service_health (service, is_down, expires_on)
values ('proxy_cert', false, '2026-11-08')
on conflict (service) do update set expires_on = excluded.expires_on;
