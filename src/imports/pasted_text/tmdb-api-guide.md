Да — и **сразу важный момент**: на скрине у тебя видны **API Key** и **API Read Access Token**. Их лучше считать **скомпрометированными** и **сразу перевыпустить** в кабинете TMDB через **Regenerate Key**. После этого не храни ключи во фронтенде и не показывай их в браузере. TMDB поддерживает аутентификацию и через `api_key`, и через `Bearer` токен в заголовке `Authorization`; для серверной интеграции обычно удобнее Bearer-токен. ([The Movie Database (TMDB)][1])

## Как это обычно делается для каталога

Правильная схема такая:

**TMDB → ваш backend → ваша БД/каталог → ваш сайт**

То есть:

1. Ваш сервер делает запросы в TMDB.
2. Забирает список фильмов.
3. Нормализует поля.
4. Сохраняет в вашу базу.
5. Фронт уже читает **вашу** базу, а не TMDB напрямую.

Это лучше, потому что:

* ключ не светится во фронте;
* можно кэшировать данные;
* можно добавить свои поля: slug, локальный статус, категории, подборки, SEO;
* можно обновлять каталог по cron.

TMDB API v3 — это REST API, который возвращает JSON, а для списков фильмов есть готовые movie list endpoints (`popular`, `top_rated`, `now_playing`, `upcoming`) и более гибкий `discover/movie`. ([The Movie Database (TMDB)][2])

---

## Какие endpoint'ы брать для каталога

### 1. Если нужен просто стартовый каталог

Используй один из готовых списков:

* `/movie/popular`
* `/movie/top_rated`
* `/movie/now_playing`
* `/movie/upcoming` ([The Movie Database (TMDB)][3])

### 2. Если нужен нормальный управляемый каталог

Лучше использовать:

```bash
GET /3/discover/movie
```

Через `discover` можно фильтровать:

* по жанрам
* по дате релиза
* по рейтингу
* по популярности
* по взрослому контенту
* по языку
* по странице пагинации

TMDB отдельно рекомендует search для поиска по названию и query/details для точечных данных, а `discover` подходит именно для построения витрин и каталогов. ([The Movie Database (TMDB)][2])

---

## Минимальная логика выгрузки

Для каталога обычно тянут такие поля из `results`:

* `id`
* `title`
* `original_title`
* `overview`
* `poster_path`
* `backdrop_path`
* `release_date`
* `genre_ids`
* `original_language`
* `popularity`
* `vote_average`
* `vote_count`
* `adult`

Потом ты уже сохраняешь это в свою таблицу `movies`.

---

## Пример запроса с Bearer token

### cURL

```bash
curl --request GET \
  --url 'https://api.themoviedb.org/3/movie/popular?language=ru-RU&page=1' \
  --header 'Authorization: Bearer YOUR_TMDB_READ_ACCESS_TOKEN' \
  --header 'accept: application/json'
```

TMDB официально показывает Bearer-аутентификацию через заголовок `Authorization`, и этот же токен можно использовать для v3/v4 методов. ([The Movie Database (TMDB)][1])

---

## Пример на PHP для вашего сервиса

Если у тебя PHP backend, можно сделать так:

```php
<?php

function tmdbRequest(string $endpoint, array $query = []): array
{
    $baseUrl = 'https://api.themoviedb.org/3';
    $token = getenv('TMDB_BEARER_TOKEN');

    $queryString = http_build_query($query);
    $url = $baseUrl . $endpoint . ($queryString ? '?' . $queryString : '');

    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);

    if ($response === false) {
        throw new Exception('TMDB request error: ' . curl_error($ch));
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);

    if ($httpCode >= 400) {
        throw new Exception('TMDB API error: HTTP ' . $httpCode . ' | ' . $response);
    }

    return $data;
}

function getPopularMovies(int $page = 1): array
{
    return tmdbRequest('/movie/popular', [
        'language' => 'ru-RU',
        'page' => $page,
    ]);
}

try {
    $movies = getPopularMovies(1);

    foreach ($movies['results'] as $movie) {
        echo $movie['id'] . ' | ' . $movie['title'] . PHP_EOL;
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
```

---

## Как сохранить в БД

Например, таблица `movies`:

```sql
CREATE TABLE movies (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) NULL,
    overview TEXT NULL,
    poster_path VARCHAR(255) NULL,
    backdrop_path VARCHAR(255) NULL,
    release_date DATE NULL,
    original_language VARCHAR(10) NULL,
    popularity DECIMAL(12,4) NULL,
    vote_average DECIMAL(4,2) NULL,
    vote_count INT NULL,
    adult TINYINT(1) DEFAULT 0,
    raw_json JSON NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

И вставка:

```php
$stmt = $pdo->prepare("
    INSERT INTO movies (
        id, title, original_title, overview, poster_path, backdrop_path,
        release_date, original_language, popularity, vote_average, vote_count, adult, raw_json
    ) VALUES (
        :id, :title, :original_title, :overview, :poster_path, :backdrop_path,
        :release_date, :original_language, :popularity, :vote_average, :vote_count, :adult, :raw_json
    )
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        original_title = VALUES(original_title),
        overview = VALUES(overview),
        poster_path = VALUES(poster_path),
        backdrop_path = VALUES(backdrop_path),
        release_date = VALUES(release_date),
        original_language = VALUES(original_language),
        popularity = VALUES(popularity),
        vote_average = VALUES(vote_average),
        vote_count = VALUES(vote_count),
        adult = VALUES(adult),
        raw_json = VALUES(raw_json),
        updated_at = CURRENT_TIMESTAMP
");
```

---

## Как выгружать все страницы, а не только первую

TMDB возвращает данные постранично, с полями вроде `page` и массивом `results`, поэтому для каталога надо пройтись циклом по страницам. ([The Movie Database (TMDB)][4])

Пример:

```php
$page = 1;
$totalPages = 1;

do {
    $response = tmdbRequest('/movie/popular', [
        'language' => 'ru-RU',
        'page' => $page,
    ]);

    foreach ($response['results'] as $movie) {
        // сохранить в БД
    }

    $totalPages = $response['total_pages'] ?? 1;
    $page++;
} while ($page <= min($totalPages, 20));
```

Обычно на старте ставят ограничение, например до 20–50 страниц, чтобы не тянуть слишком много.

---

## Как получать постеры

TMDB отдельно указывает, что конфигурационные методы полезны для получения image information. То есть корректнее сначала запросить configuration, а уже потом собирать URL изображений. ([The Movie Database (TMDB)][2])

Но на практике часто используют шаблон:

```text
https://image.tmdb.org/t/p/w500 + poster_path
```

Например:

```php
$posterUrl = $movie['poster_path']
    ? 'https://image.tmdb.org/t/p/w500' . $movie['poster_path']
    : null;
```

---

## Что я бы рекомендовал именно для вашего сервиса

### Вариант 1 — простой MVP

Подходит, если нужен каталог без сложной фильтрации:

* cron раз в день
* endpoint `/movie/popular`
* сохраняем в `movies`
* на сайте выводим из БД

### Вариант 2 — уже нормально

Подходит, если хочешь каталог как мини-кинотеатр:

* `discover/movie`
* отдельная таблица `genres`
* таблица связей `movie_genres`
* cron обновления
* отдельная ручка поиска через `/search/movie` ([The Movie Database (TMDB)][5])

### Вариант 3 — продакшн-подход

* первичная массовая загрузка
* обновление по расписанию
* отдельная очередь на догрузку деталей фильма `/movie/{id}`
* кэш постеров
* свои подборки и SEO-страницы

---

## Какие ручки нужны вам минимум

Для нормального каталога я бы сделал так:

### 1. Импорт фильмов

```text
POST /internal/tmdb/import
```

### 2. Получить фильмы из своей БД

```text
GET /api/catalog/movies?page=1&genre=28&sort=popular
```

### 3. Поиск

```text
GET /api/catalog/search?q=batman
```

### 4. Обновление по cron

```text
php cron/import_tmdb_movies.php
```

---

## Важный юридический момент

TMDB пишет, что для некоммерческого использования API бесплатен при указании атрибуции, а в приложении должен быть notice вида:
**“This product uses the TMDB API but is not endorsed or certified by TMDB.”**
Также TMDB просит использовать их логотип и корректную атрибуцию в разделе About/Credits. ([The Movie Database (TMDB)][6])

---

## Что бы я сделал на твоем месте прямо сейчас

1. **Сразу перевыпустил ключи** — потому что они уже засвечены.
2. Вынес токен в `.env`:

```env
TMDB_BEARER_TOKEN=...
```

3. Сделал серверный импорт через PHP.
4. Сохранял бы фильмы в MySQL.
5. На фронт отдавал бы уже свой API.

---

## Готовый маршрут для быстрого запуска

### Шаг 1

Сделай таблицу `movies`

### Шаг 2

Сделай PHP-функцию `tmdbRequest()`

### Шаг 3

Сделай импорт:

* popular
* now_playing
* top_rated

### Шаг 4

Сохраняй в БД

### Шаг 5

Выводи каталог уже из MySQL

---

Если хочешь, я следующим сообщением могу сразу дать тебе **готовый PHP-скрипт импорта TMDB в MySQL** под твой формат, чтобы ты просто вставил `.env`, данные БД и запустил.

[1]: https://developer.themoviedb.org/docs/authentication-application?utm_source=chatgpt.com "Application"
[2]: https://developer.themoviedb.org/docs/getting-started?utm_source=chatgpt.com "TMDb API"
[3]: https://developer.themoviedb.org/reference/tv-series-details?utm_source=chatgpt.com "TV Series Details"
[4]: https://developer.themoviedb.org/reference/getting-started?utm_source=chatgpt.com "Getting Started"
[5]: https://developer.themoviedb.org/reference/search-movie?utm_source=chatgpt.com "Search - Movies"
[6]: https://developer.themoviedb.org/docs/faq?utm_source=chatgpt.com "FAQ"