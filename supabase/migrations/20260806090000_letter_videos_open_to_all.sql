-- Руслан дал письменное согласие на массовое использование видео произношения букв —
-- открываем бакет letter-videos всем авторизованным пользователям вместо одного dev-аккаунта.
drop policy if exists "letter_videos_owner_only" on storage.objects;

create policy "letter_videos_authenticated_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'letter-videos');
