# Project alignment notes

Цель этого файла - показать, насколько дипломная работа соответствует реальному приложению, и что нужно поправить, чтобы текст выглядел убедительно на защите.

## 1. Общая оценка соответствия

Примерная оценка: 70-75% дипломной работы основано на реальном приложении.

Это хороший уровень для текущего состояния, потому что основные модули действительно существуют в коде. Но оставшиеся 25-30% создают риск на нормоконтроле или защите: часть утверждений слишком общая, часть не подтверждена артефактами, часть не совпадает с реальным кодом.

Цель исправлений: поднять соответствие до 90%+.

## 2. Что подтверждается кодом

### Frontend

Фактически есть:

- React SPA на Vite.
- `react-router`.
- Public, protected and admin layouts.
- Pages:
  - home
  - search
  - movie detail
  - TV detail
  - person
  - library
  - watchlist
  - recommendations
  - friends
  - AI chat
  - profile
  - collections
  - admin dashboard/users/content/analytics/settings
- Contexts:
  - AuthContext
  - ThemeContext
  - LangContext
  - UserDataContext
  - SidebarContext

Можно уверенно писать:

```text
The frontend is implemented as a React single-page application with route-based separation between public, protected and administrator-only sections.
```

### Backend

Фактически есть:

- Supabase Edge Function.
- Hono app.
- Supabase Auth integration.
- KV store helper.
- TMDB proxy.
- OpenAI integration.
- Wazzup and Mobizon OTP sending.
- Admin helper `requireAdmin`.

Можно уверенно писать:

```text
The backend is implemented as a Supabase Edge Function using the Hono framework. It centralizes API routing, authentication checks, TMDB proxying, user data operations, AI features and administrative functionality.
```

### User features

Фактически есть:

- Signup/login.
- Profile.
- Avatar upload.
- Watched movies.
- Watchlist.
- Ratings and reviews.
- Top reviews.
- Friends.
- Friend requests.
- Movie recommendations from friends.
- Collections.
- Public collection browsing.

### AI features

Фактически есть:

- `/ai/chat`
- `/ai/analyze-review`
- `/ai/explain`
- `/recommendations`

Важно: `/recommendations` не является `/ai/recommend`. Это отдельный backend endpoint с content-based recommendation logic.

## 3. Что нужно синхронизировать

### 3.1 Model name

В дипломе встречается:

```text
gpt-4o-mini
```

В коде сейчас:

```ts
model: "gpt-5.4-mini"
```

Нужно выбрать один вариант и привести все к нему.

Рекомендация:

- Если фактически в продакшне используется `gpt-5.4-mini`, изменить диплом.
- Если диплом должен защищать `gpt-4o-mini`, изменить backend.

### 3.2 Domain

В дипломе и старом генераторе диплома встречаются разные домены:

- `qaradakor.kz`
- `qaradakor.sofine.kz`

Нужно выбрать один финальный домен и использовать его везде.

### 3.3 OpenAI pricing

В дипломе указана цена для `gpt-4o-mini`. Если модель изменилась, стоимость тоже нужно обновить или убрать конкретные цифры.

Безопасная формулировка:

```text
The selected model was chosen for its balance between response quality, latency and operational cost.
```

### 3.4 Supabase KV

В дипломе нужно аккуратно писать про KV store.

Фактически используется helper `kv_store.tsx`, который хранит JSON-like данные по ключам. Лучше избегать утверждений, что это строгая реляционная схема с полноценными SQL-таблицами для всех сущностей.

Правильная формулировка:

```text
Application-specific data is stored in a PostgreSQL-backed key-value store, where each user-related entity is represented by a structured key and a JSON-compatible value.
```

## 4. Что выглядит неподтвержденным

Эти места лучше не оставлять без доказательств:

| Claim | Риск | Что сделать |
| --- | --- | --- |
| `92% factual accuracy` | Нет тестового отчета | Убрать или добавить Appendix E |
| `94% sentiment accuracy` | Нет dataset/report | Убрать или добавить таблицу тестов |
| `4.3/5 recommendation relevance` | Нет user survey | Убрать или добавить анкету |
| `400 person-hours` | Не подтверждается репозиторием | Оставить только если есть журнал работ |
| `six development sprints` | Нет sprint artifacts | Смягчить как "iterative development" |
| `security scans confirmed HSTS/XSS headers` | Нет отчета | Добавить скриншот/отчет или убрать |
| `CI workflow` | В репозитории не видно workflow-файлов | Убрать или описать как planned improvement |

## 5. Технические рекомендации по проекту

### 5.1 Build reproducibility

Проблема:

- `node_modules` отсутствует.
- Lock-файл отсутствует.
- `npm run build` не проходит без установки зависимостей.

Рекомендации:

- Добавить `package-lock.json` или `pnpm-lock.yaml`.
- Зафиксировать package manager.
- Перед защитой выполнить:

```bash
npm install
npm run build
```

И добавить результат сборки в приложения или в текст тестирования.

### 5.2 CORS

Сейчас backend использует:

```ts
origin: "*"
```

Для production лучше:

```ts
origin: ["https://qaradakor.kz"]
```

Если нужен preview/dev:

```ts
origin: ["https://qaradakor.kz", "http://localhost:5173"]
```

### 5.3 Logging

В backend много `console.log`. Для диплома это можно описать как development logging, но для production лучше:

- убрать логи с внешними API response bodies;
- не логировать части ключей;
- не логировать OTP/session details;
- оставить только error/status logs.

### 5.4 Admin security

Фактически admin status хранится в `profile.is_admin`.

Рекомендации:

- В дипломе писать именно это.
- Добавить в текст, что admin endpoints требуют:
  - valid user session;
  - `is_admin === true` in user profile.

### 5.5 API documentation

Для приложения полезно добавить `Appendix B - API endpoints`.

Реальные группы endpoint:

- System:
  - `GET /health`
- Auth:
  - `POST /signup`
  - `GET /auth/2fa-status`
  - `POST /auth/2fa-setup-send`
  - `POST /auth/2fa-setup-confirm`
  - `POST /auth/2fa-disable`
  - `POST /auth/send-otp`
  - `POST /auth/verify-otp`
  - `POST /auth/sms-login-send`
  - `POST /auth/sms-login-verify`
- TMDB:
  - `GET /tmdb/*`
- Library:
  - `GET /watched`
  - `POST /watched`
  - `DELETE /watched/:movieId`
  - `GET /watchlist`
  - `POST /watchlist`
  - `DELETE /watchlist/:movieId`
- Friends:
  - `GET /friends`
  - `POST /friends/request`
  - `GET /friends/requests`
  - `POST /friends/accept`
  - `POST /friends/reject`
  - `DELETE /friends/:friendId`
  - `GET /friends/:friendId/watched`
  - `GET /friends/:friendId/profile`
  - `GET /friends/:friendId/avatar`
  - `POST /friends/recommend`
  - `GET /friends/recommendations`
  - `POST /friends/recommendations/:recId/seen`
- Reviews:
  - `GET /reviews/top`
  - `GET /reviews/movie/:movieId`
  - `POST /reviews/:reviewId/like`
  - `DELETE /reviews/:reviewId`
- Recommendations:
  - `GET /recommendations`
- Profile:
  - `GET /profile`
  - `PUT /profile`
  - `POST /profile/phone`
  - `POST /profile/avatar`
  - `GET /profile/avatar`
- AI:
  - `POST /ai/chat`
  - `POST /ai/analyze-review`
  - `POST /ai/explain`
- Collections:
  - `GET /collections`
  - `POST /collections`
  - `GET /collections/:id`
  - `PUT /collections/:id`
  - `DELETE /collections/:id`
  - `POST /collections/:id/movies`
  - `DELETE /collections/:id/movies/:movieId`
  - `POST /collections/:id/like`
  - `POST /collections/:id/comments`
  - `DELETE /collections/:id/comments/:commentId`
  - `GET /my-collections`
- Admin:
  - `POST /admin/bootstrap`
  - `POST /admin/grant`
  - `GET /admin/check`
  - `GET /admin/dashboard-stats`
  - `GET /admin/users`
  - `POST /admin/users/:userId/toggle-block`
  - `POST /admin/users/:userId/toggle-admin`
  - `GET /admin/users/export`
  - `DELETE /admin/users/:userId`
  - `GET /admin/collections`
  - `POST /admin/collections/:id/toggle-featured`
  - `DELETE /admin/collections/:id`
  - `GET /admin/reviews`
  - `DELETE /admin/reviews/:id`
  - `GET /admin/comments`
  - `DELETE /admin/comments/:collectionId/:commentId`
  - `GET /admin/analytics`
  - `GET /admin/settings`
  - `POST /admin/settings`
  - `POST /admin/send-notification`

## 6. Рекомендации для защиты

### Что показывать комиссии

Лучший сценарий демонстрации:

1. Главная страница.
2. Поиск фильма через TMDB.
3. Карточка фильма.
4. Добавление в watched/watchlist.
5. Написание отзыва.
6. Рекомендации.
7. AI chat.
8. Profile and 2FA setup.
9. Friends или collections.
10. Admin dashboard.

### Что говорить про научную/практическую новизну

Безопасная формулировка:

```text
The novelty of the project is not in inventing a new recommendation algorithm from scratch, but in adapting content-based recommendation, explainable AI interaction and localized user experience to a Kazakh-language movie platform with integrated authentication, social features and AI-assisted movie discovery.
```

### Что говорить про ограничения

Хорошая формулировка:

```text
The current recommendation engine is primarily content-based. This makes it transparent and suitable for early-stage deployment, but it limits the use of collaborative signals until a larger user base is collected. Future work includes hybrid recommendation models, stronger evaluation datasets and mobile/PWA support.
```

## 7. Final recommendation

Проект достаточно сильный для диплома, потому что есть реальный frontend, backend, AI, auth, social features and admin functionality. Основная задача сейчас не переписать приложение, а привести диплом к аккуратному состоянию:

- убрать неподтвержденные цифры;
- исправить структуру Word;
- заменить неточные диаграммы;
- добавить приложения;
- синхронизировать текст с кодом;
- усилить источники;
- вычитать английский язык.

После этих правок работа будет выглядеть намного более профессионально и убедительно.

