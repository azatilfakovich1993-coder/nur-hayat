-- Политика вставки событий воронки была `with check (true)`: любой клиент —
-- включая неавторизованного — мог записать событие с ЧУЖИМ user_id. То есть
-- статистику можно было незаметно испортить, приписав кому угодно любые шаги,
-- и решения по воронке принимались бы по подделанным данным.
--
-- Теперь событие принимается либо совсем без пользователя (так пишутся экраны
-- до входа — авторизация, шаги регистрации), либо строго от своего имени.
drop policy if exists "insert own analytics events" on analytics_events;

create policy "insert own analytics events"
  on analytics_events for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
