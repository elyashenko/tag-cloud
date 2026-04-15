# Live Tag Cloud Voting

Интерактивное облако тегов с онлайн-голосованием в реальном времени для конференций, воркшопов и мероприятий.

## Стек

- **Frontend:** React 19, TypeScript 6, Tailwind CSS 4
- **Framework:** Next.js 15 (App Router)
- **Database:** SQLite (libSQL) + Drizzle ORM
- **Code Quality:** ESLint 9, Jest, Lefthook
- **Deploy:** Vercel

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Инициализация базы данных

Создание таблиц в SQLite:

```bash
npm run db:push
```

Если используете Turso через интеграцию Vercel, сначала подтяните переменные:

```bash
vercel env pull .env.development.local
```

Проект автоматически читает `.env.local` и `.env.development.local`, поэтому дополнительных шагов для `drizzle-kit` не требуется.

Можно выполнить всё одной командой:

```bash
npm run db:setup:vercel
```

### 3. (Опционально) Создать демо-сессию

```bash
npm run seed
```

Создаёт пустую демо-сессию с кодом `DEMO42` (без предустановленных тегов).

### 4. Запуск dev-сервера

```bash
npm run dev
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Качество и проверки

### Локальные проверки

```bash
# Lint
npm run lint

# Тесты
npm run test

# Покрытие
npm run test:coverage

# CI-режим тестов
npm run test:ci
```

### Git hooks (lefthook)

- При коммите запускаются `lint` и `test` (hook `pre-commit`)
- Установка хуков:

```bash
npm run prepare
```

### CI

- Workflow: `.github/workflows/ci.yml`
- Node.js: `24`
- Шаги: `npm ci` → `npm run lint` → `npm run test:ci`

## Использование

### Модератор

1. Перейти на `/admin`
2. Задать название сессии и вопрос для аудитории
3. Нажать «Создать сессию»
4. Показать QR-код или поделиться ссылкой с аудиторией
5. Открыть `/display/{id}` для проекции WordCloud на экран
6. Следить за результатами, при необходимости удалять нежелательные слова
7. Нажать «Завершить сессию» по окончании

### Зрители

1. Отсканировать QR-код или перейти по ссылке (либо ввести код на главной)
2. Ввести свои слова/фразы (до 3 штук)
3. Можно удалить свой ответ и ввести другой до закрытия сессии
4. Зритель видит **только своё поле ввода** — облако тегов и чужие ответы не отображаются

## Структура проекта

```
src/
├── app/
│   ├── page.tsx                          # Главная (вход по коду)
│   ├── admin/
│   │   ├── page.tsx                      # Панель модератора
│   │   └── session/[id]/page.tsx         # Управление сессией
│   ├── vote/[code]/page.tsx              # Свободный ввод слов (зритель)
│   ├── display/[id]/page.tsx             # WordCloud на экран
│   └── api/v1/
│       ├── sessions/                     # CRUD сессий
│       │   └── [id]/
│       │       ├── tags/                 # Теги (только GET и DELETE)
│       │       ├── votes/                # Голосование (POST, DELETE, GET /me)
│       │       └── results/              # Агрегированные результаты
│       └── auth/session/                 # Анонимная сессия зрителя
├── db/
│   ├── schema.ts                         # Drizzle ORM схема
│   └── index.ts                          # Подключение к БД
├── lib/
│   ├── session.ts                        # Cookie-сессии зрителей
│   └── utils.ts                          # Утилиты (ID, коды)
└── components/
    └── WordCloud.tsx                      # Компонент облака тегов
```

## API Endpoints

| Метод    | Endpoint                              | Описание                      |
| -------- | ------------------------------------- | ----------------------------- |
| `GET`    | `/api/v1/sessions`                    | Список сессий                 |
| `POST`   | `/api/v1/sessions`                    | Создать сессию (без тегов)    |
| `GET`    | `/api/v1/sessions/:id`                | Данные сессии                 |
| `PATCH`  | `/api/v1/sessions/:id`                | Обновить сессию               |
| `GET`    | `/api/v1/sessions/join/:code`         | Найти сессию по коду          |
| `GET`    | `/api/v1/sessions/:id/tags`           | Теги сессии                   |
| `DELETE` | `/api/v1/sessions/:id/tags/:tagId`    | Удалить тег (модерация)       |
| `POST`   | `/api/v1/sessions/:id/votes`          | Отправить слово               |
| `DELETE` | `/api/v1/sessions/:id/votes?tagId=X`  | Удалить свой голос            |
| `GET`    | `/api/v1/sessions/:id/votes/me`       | Мои голоса                    |
| `GET`    | `/api/v1/sessions/:id/results`        | Результаты (counts)           |

### Авторизация

- **Модератор:** заголовок `x-moderator-token` с токеном, полученным при создании сессии
- **Зрители:** HTTP-only cookie `viewer_id`, устанавливается автоматически

## База данных

### Схема

4 таблицы: `sessions`, `tags`, `votes`, `viewer_sessions`.

Схема описана в `src/db/schema.ts` (Drizzle ORM).

### Управление

```bash
# Создать/обновить таблицы
npm run db:push

# Открыть Drizzle Studio (визуальный просмотр БД)
npm run db:studio

# Создать демо-сессию
npm run seed
```

Файл базы: `data/tagcloud.db` (создаётся автоматически).

## Деплой на Vercel

1. Установить Vercel CLI: `npm i -g vercel`
2. В Vercel Marketplace создать Turso database
3. Добавить переменные окружения в проект Vercel:
   - либо `DATABASE_URL` + `DATABASE_AUTH_TOKEN`
   - либо `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (имена из Turso integration)
4. Применить схему к удалённой базе: `npm run db:push`
5. `vercel deploy`

### Переменные окружения (production)

| Переменная               | Описание                        |
| ------------------------ | ------------------------------- |
| `NEXT_PUBLIC_APP_URL`    | Базовый URL приложения          |
| `DATABASE_URL`           | URL базы (Turso / libSQL)       |
| `DATABASE_AUTH_TOKEN`    | Токен доступа к Turso           |
| `TURSO_DATABASE_URL`     | Альтернативное имя URL из integration |
| `TURSO_AUTH_TOKEN`       | Альтернативное имя токена из integration |

### Частые ошибки конфигурации

- `DATABASE_URL (or TURSO_DATABASE_URL) is required in production.`
  - Причина: в Vercel не задан URL переменной для БД
  - Решение: добавить `DATABASE_URL` или `TURSO_DATABASE_URL` и сделать redeploy
- `DATABASE_AUTH_TOKEN (or TURSO_AUTH_TOKEN) is required for Turso/libSQL remote database.`
  - Причина: используется `libsql://...`, но не задан токен
  - Решение: добавить `DATABASE_AUTH_TOKEN` или `TURSO_AUTH_TOKEN` и сделать redeploy

## Лицензия

MIT
