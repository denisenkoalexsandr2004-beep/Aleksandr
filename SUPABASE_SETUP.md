1. Зайди на `https://supabase.com/`
2. Создай проект
3. Открой `Project Settings` -> `API`
4. Скопируй:
   - `Project URL`
   - `anon public key`
5. Открой [auth.js](</c:/Users/Александр/OneDrive/Документы/Zoom/auth.js>)
6. Вставь эти значения вместо:
   - `PASTE_SUPABASE_URL_HERE`
   - `PASTE_SUPABASE_ANON_KEY_HERE`

Для MVP-кабинета нужна таблица `profiles`.

Открой в Supabase `SQL Editor` и выполни:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  status text,
  status_note text,
  goal text,
  goal_note text,
  training_format text,
  training_format_note text,
  notes text,
  contact_link text
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    status,
    status_note,
    goal,
    goal_note,
    training_format,
    training_format_note,
    notes,
    contact_link
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'Новая заявка',
    'Клиенту выдан доступ в кабинет. Следующий шаг — заполнить профиль и определить рабочий ритм.',
    'Цель клиента',
    'Здесь можно зафиксировать главный фокус текущего этапа.',
    'Формат работы',
    'Зал, дом или смешанная модель сопровождения.',
    'Профиль создан автоматически. Добавь персональные заметки после первого контакта.',
    'start.html'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id);
```

После этого:
- [login.html](</c:/Users/Александр/OneDrive/Документы/Zoom/login.html>) станет экраном входа
- [account.html](</c:/Users/Александр/OneDrive/Документы/Zoom/account.html>) станет личным кабинетом
- через [auth.js](</c:/Users/Александр/OneDrive/Документы/Zoom/auth.js>) ты сможешь выдавать доступ клиенту
- при создании нового клиента профиль будет появляться автоматически
