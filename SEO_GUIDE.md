# SEO Оптимизация для Qaradakor.kz

## 📋 Содержание

1. [Обзор](#обзор)
2. [Файлы и структура](#файлы-и-структура)
3. [Использование компонента SEO](#использование-компонента-seo)
4. [Настройка Sitemap](#настройка-sitemap)
5. [Robots.txt](#robotstxt)
6. [Структурированные данные](#структурированные-данные)
7. [Open Graph и Twitter Cards](#open-graph-и-twitter-cards)
8. [Настройка на сервере](#настройка-на-сервере)
9. [Проверка и мониторинг](#проверка-и-мониторинг)
10. [Чек-лист](#чек-лист)

---

## Обзор

Для qaradakor.kz настроена полноценная SEO инфраструктура, включающая:

- ✅ **Robots.txt** — управление индексацией
- ✅ **Sitemap.xml** — динамическая генерация карты сайта
- ✅ **SEO компонент** — управление meta-тегами на каждой странице
- ✅ **Структурированные данные (JSON-LD)** — улучшенные сниппеты в поиске
- ✅ **Open Graph & Twitter Cards** — красивые превью в соцсетях
- ✅ **Hreflang теги** — поддержка трёх языков (ru, kk, en)
- ✅ **PWA Manifest** — установка как приложение

---

## Файлы и структура

```
/public/
  ├── robots.txt              # Правила для поисковых ботов
  ├── site.webmanifest        # PWA манифест
  ├── favicon.ico
  ├── favicon-16x16.png
  ├── favicon-32x32.png
  ├── apple-touch-icon.png
  ├── og-image.jpg            # Изображение для Open Graph (1200x630)
  └── logo.png                # Логотип для Schema.org

/src/app/
  ├── components/
  │   └── seo.tsx             # SEO компонент для управления meta-тегами
  └── lib/
      ├── sitemap.ts          # Генерация sitemap XML
      └── sitemap-routes.ts   # API endpoints для sitemap
```

---

## Использование компонента SEO

### Пример 1: Главная страница

```tsx
import { SEO, generateOrganizationStructuredData, generateWebSiteStructuredData } from "../components/seo";

export function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      generateOrganizationStructuredData(),
      generateWebSiteStructuredData()
    ]
  };

  return (
    <>
      <SEO
        title="Qaradakor.kz — Персональная библиотека фильмов"
        description="Откройте для себя мир кино с AI-рекомендациями"
        keywords={["кино", "фильмы", "библиотека фильмов", "казахстан"]}
        structuredData={structuredData}
      />
      {/* Ваш контент */}
    </>
  );
}
```

### Пример 2: Страница фильма

```tsx
import { SEO, generateMovieStructuredData } from "../components/seo";

export function MovieDetailPage() {
  const movie = {
    id: 550,
    title: "Бойцовский клуб",
    overview: "История о...",
    poster_path: "/path.jpg",
    release_date: "1999-10-15",
    vote_average: 8.4,
    vote_count: 27000,
    genres: [{ id: 18, name: "Драма" }],
    runtime: 139,
    director: "Дэвид Финчер",
    actors: ["Брэд Питт", "Эдвард Нортон"]
  };

  return (
    <>
      <SEO
        title={`${movie.title} — Qaradakor.kz`}
        description={movie.overview}
        ogImage={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
        ogType="video.movie"
        canonical={`https://qaradakor.kz/movie/${movie.id}`}
        structuredData={generateMovieStructuredData(movie)}
      />
      {/* Ваш контент */}
    </>
  );
}
```

### Пример 3: Приватная страница (без индексации)

```tsx
import { SEO } from "../components/seo";

export function ProfilePage() {
  return (
    <>
      <SEO
        title="Мой профиль — Qaradakor.kz"
        noindex={true}
      />
      {/* Ваш контент */}
    </>
  );
}
```

---

## Настройка Sitemap

### Структура Sitemap

Создано 5 файлов sitemap:

1. **sitemap.xml** — статические страницы (главная, поиск, коллекции)
2. **sitemap-movies.xml** — динамический список фильмов (500 популярных)
3. **sitemap-tv.xml** — динамический список сериалов (500 популярных)
4. **sitemap-collections.xml** — публичные коллекции (100 штук)
5. **sitemap-index.xml** — индекс всех sitemap'ов

### Автоматическая генерация

Sitemap'ы генерируются динамически на основе данных из Supabase:

```typescript
import { 
  generateMainSitemap,
  generateMoviesSitemap,
  generateTVSitemap,
  generateCollectionsSitemap 
} from './src/app/lib/sitemap';

// Получение sitemap для фильмов
const moviesXml = await generateMoviesSitemap();
```

---

## Robots.txt

### Текущая конфигурация

```
# Открыто для индексации
Allow: /
Allow: /movie/
Allow: /tv/
Allow: /person/
Allow: /collections
Allow: /search

# Закрыто от индексации
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /library
Disallow: /watchlist
Disallow: /admin/

# Ссылки на sitemap
Sitemap: https://qaradakor.kz/sitemap.xml
Sitemap: https://qaradakor.kz/sitemap-movies.xml
```

**Расположение:** `/public/robots.txt`

---

## Структурированные данные

### Типы Schema.org

#### 1. Organization (Организация)
```typescript
generateOrganizationStructuredData()
```

#### 2. WebSite (Сайт с поиском)
```typescript
generateWebSiteStructuredData()
```

#### 3. Movie (Фильм)
```typescript
generateMovieStructuredData(movie)
```

#### 4. TVSeries (Сериал)
```typescript
generateTVStructuredData(tv)
```

#### 5. Person (Актёр/Режиссёр)
```typescript
generatePersonStructuredData(person)
```

### Проверка структурированных данных

Используйте [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## Open Graph и Twitter Cards

### Требования к изображениям

- **Open Graph**: 1200x630 px (соотношение 1.91:1)
- **Twitter Card**: 1200x630 px
- **Формат**: JPG или PNG
- **Размер**: < 5 MB

### Создание OG изображения

Разместите изображение в `/public/og-image.jpg`

Для динамических страниц (фильмы, сериалы) используйте постеры TMDB:

```typescript
ogImage={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
```

---

## Настройка на сервере

### Вариант 1: Vite + Express

Создайте `server.js`:

```javascript
import express from 'express';
import { 
  generateMainSitemap,
  generateMoviesSitemap,
  generateTVSitemap,
  generateCollectionsSitemap,
  generateSitemapIndex
} from './src/app/lib/sitemap.ts';

const app = express();

// Основной sitemap
app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  const xml = generateMainSitemap();
  res.send(xml);
});

// Фильмы
app.get('/sitemap-movies.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  const xml = await generateMoviesSitemap();
  res.send(xml);
});

// И так далее для других sitemap'ов...

app.listen(3000);
```

### Вариант 2: Vercel/Netlify

Создайте serverless функции:

**`/api/sitemap.ts`** (для Vercel):

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateMainSitemap } from '../src/app/lib/sitemap';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const xml = generateMainSitemap();
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
}
```

### Вариант 3: Nginx

Настройте редирект на статические XML файлы или прокси к вашему API.

---

## Проверка и мониторинг

### 1. Google Search Console

1. Добавьте сайт: [search.google.com/search-console](https://search.google.com/search-console)
2. Отправьте sitemap: `https://qaradakor.kz/sitemap-index.xml`
3. Мониторьте:
   - Индексацию страниц
   - Ошибки сканирования
   - Эффективность поиска
   - Core Web Vitals

### 2. Yandex Webmaster

**Важно для Казахстана!**

1. Добавьте сайт: [webmaster.yandex.ru](https://webmaster.yandex.ru)
2. Отправьте sitemap
3. Проверьте индексацию

### 3. Инструменты для проверки

- **Robots.txt**: [robots-txt-checker](https://support.google.com/webmasters/answer/6062598)
- **Sitemap**: [xml-sitemaps.com/validate-xml-sitemap](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- **Open Graph**: [opengraphcheck.com](https://opengraphcheck.com)
- **Twitter Cards**: [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)
- **Структурированные данные**: [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- **PageSpeed**: [pagespeed.web.dev](https://pagespeed.web.dev)

---

## Чек-лист

### ✅ Базовая настройка

- [x] Создан `/public/robots.txt`
- [x] Создана система генерации sitemap
- [x] Создан SEO компонент
- [x] Обновлён `index.html` с мета-тегами
- [x] Создан PWA манифест

### 🎯 Что нужно сделать

- [ ] **Создать OG изображение** (`/public/og-image.jpg`, 1200x630px)
- [ ] **Создать favicon'ы** всех размеров
- [ ] **Настроить серверные endpoints** для sitemap
- [ ] **Добавить SEO компонент** на все основные страницы:
  - [ ] Главная страница (`/src/app/pages/home.tsx`)
  - [ ] Страница фильма (`/src/app/pages/movie-detail.tsx`)
  - [ ] Страница сериала (`/src/app/pages/tv-detail.tsx`)
  - [ ] Страница персоны (`/src/app/pages/person.tsx`)
  - [ ] Страница поиска (`/src/app/pages/search.tsx`)
  - [ ] Страница коллекций (`/src/app/pages/collections.tsx`)
- [ ] **Зарегистрировать сайт** в Google Search Console
- [ ] **Зарегистрировать сайт** в Yandex Webmaster
- [ ] **Отправить sitemap** в обе системы
- [ ] **Настроить Google Analytics** (опционально)
- [ ] **Настроить Yandex Metrica** (опционально)

### 🚀 Продвинутая оптимизация

- [ ] Настроить SSR (Server-Side Rendering) для лучшей индексации
- [ ] Добавить Breadcrumbs Schema.org
- [ ] Оптимизировать изображения (WebP, lazy loading)
- [ ] Настроить CDN (Cloudflare)
- [ ] Добавить AMP версии (опционально)
- [ ] Настроить локальный бизнес Schema для казахстанских пользователей

---

## 📚 Полезные ссылки

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/docs/documents.html)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)

---

## 🆘 Поддержка

Если возникли вопросы по SEO настройке, проверьте:

1. Работает ли `/robots.txt` — откройте `https://qaradakor.kz/robots.txt`
2. Работают ли sitemap'ы — откройте `https://qaradakor.kz/sitemap.xml`
3. Правильно ли отображаются мета-теги — просмотрите исходный код страницы (Ctrl+U)
4. Проверьте консоль браузера на ошибки

**Дата обновления:** 31 марта 2025
