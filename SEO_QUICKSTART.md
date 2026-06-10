# 🚀 Быстрый старт: SEO настройка Qaradakor.kz

## ✅ Что уже сделано

1. ✅ **robots.txt** создан в `/public/robots.txt`
2. ✅ **Sitemap генератор** создан в `/src/app/lib/sitemap.ts`
3. ✅ **SEO компонент** создан в `/src/app/components/seo.tsx`
4. ✅ **index.html** обновлён с полными meta-тегами
5. ✅ **PWA manifest** создан в `/public/site.webmanifest`
6. ✅ **SEO добавлен** на главную страницу (`/src/app/pages/home.tsx`)
7. ✅ **Документация** создана в `/SEO_GUIDE.md`

---

## 📝 Что нужно сделать СЕЙЧАС

### 1. Создать изображения (КРИТИЧНО)

#### a) Open Graph изображение
- **Путь:** `/public/og-image.jpg`
- **Размер:** 1200x630 пикселей
- **Содержание:** Логотип Qaradakor + текст "Персональная библиотека фильмов"
- **Формат:** JPG или PNG

#### b) Логотип
- **Путь:** `/public/logo.png`
- **Размер:** 512x512 пикселей (квадрат)
- **Формат:** PNG с прозрачностью

#### c) Favicon (если ещё нет)
- `/public/favicon.ico` (32x32)
- `/public/favicon-16x16.png`
- `/public/favicon-32x32.png`
- `/public/apple-touch-icon.png` (180x180)
- `/public/android-chrome-192x192.png`
- `/public/android-chrome-512x512.png`

**Инструмент:** Можете использовать [realfavicongenerator.net](https://realfavicongenerator.net)

---

### 2. Настроить серверные endpoints для sitemap

Выберите один из вариантов:

#### Вариант A: Express сервер (рекомендуется)

Создайте файл `server.js`:

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

app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  const xml = generateMainSitemap();
  res.send(xml);
});

app.get('/sitemap-movies.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  const xml = await generateMoviesSitemap();
  res.send(xml);
});

app.get('/sitemap-tv.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  const xml = await generateTVSitemap();
  res.send(xml);
});

app.get('/sitemap-collections.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  const xml = await generateCollectionsSitemap();
  res.send(xml);
});

app.get('/sitemap-index.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  const xml = generateSitemapIndex();
  res.send(xml);
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

#### Вариант B: Vercel Serverless Functions

Создайте файлы в `/api/`:
- `/api/sitemap.ts`
- `/api/sitemap-movies.ts`
- `/api/sitemap-tv.ts`
- `/api/sitemap-collections.ts`

---

### 3. Добавить SEO на остальные страницы

Используйте примеры из документации:

#### a) Страница фильма (`/src/app/pages/movie-detail.tsx`)

```tsx
import { SEO, generateMovieStructuredData } from "../components/seo";

// В компоненте:
<SEO
  title={`${movie.title} — Qaradakor.kz`}
  description={movie.overview}
  ogImage={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
  ogType="video.movie"
  structuredData={generateMovieStructuredData(movie)}
/>
```

#### b) Страница сериала (`/src/app/pages/tv-detail.tsx`)

```tsx
import { SEO, generateTVStructuredData } from "../components/seo";

<SEO
  title={`${tv.name} — Qaradakor.kz`}
  description={tv.overview}
  ogImage={`https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`}
  ogType="video.tv_show"
  structuredData={generateTVStructuredData(tv)}
/>
```

#### c) Приватные страницы

```tsx
<SEO
  title="Мой профиль — Qaradakor.kz"
  noindex={true}
/>
```

---

### 4. Зарегистрировать сайт в поисковых системах

#### Google Search Console
1. Перейдите на [search.google.com/search-console](https://search.google.com/search-console)
2. Добавьте сайт `qaradakor.sofine.kz`
3. Подтвердите владение (через HTML файл или DNS)
4. Отправьте sitemap: `https://qaradakor.sofine.kz/sitemap-index.xml`

#### Yandex Webmaster (важно для Казахстана!)
1. Перейдите на [webmaster.yandex.ru](https://webmaster.yandex.ru)
2. Добавьте сайт
3. Подтвердите владение
4. Отправьте sitemap

---

### 5. Проверить работоспособность

Откройте в браузере:
- `https://qaradakor.sofine.kz/robots.txt` ✅
- `https://qaradakor.sofine.kz/sitemap.xml` ⚠️ (требует настройки сервера)
- `https://qaradakor.sofine.kz/site.webmanifest` ✅

Проверьте инструментами:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Opengraph.xyz](https://www.opengraph.xyz/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

---

## 📊 Приоритетность задач

### 🔴 КРИТИЧНО (сделать сегодня)
1. Создать `/public/og-image.jpg`
2. Создать `/public/logo.png`
3. Настроить серверные endpoints для sitemap

### 🟡 ВАЖНО (сделать на этой неделе)
4. Добавить SEO компонент на страницы фильмов/сериалов
5. Зарегистрировать в Google Search Console
6. Зарегистрировать в Yandex Webmaster

### 🟢 ЖЕЛАТЕЛЬНО (сделать в течение месяца)
7. Добавить Google Analytics
8. Настроить Yandex Metrica
9. Оптимизировать изображения (WebP)
10. Настроить CDN (Cloudflare)

---

## 🆘 Возникли проблемы?

**Проблема:** Sitemap не работает  
**Решение:** Убедитесь, что настроены серверные endpoints (см. раздел 2)

**Проблема:** Meta-теги не обновляются  
**Решение:** Очистите кэш браузера (Ctrl+Shift+Del) и перезагрузите страницу

**Проблема:** Open Graph не отображается в соцсетях  
**Решение:** 
1. Проверьте, что изображение `/public/og-image.jpg` существует
2. Используйте [opengraph.xyz](https://www.opengraph.xyz/) для проверки
3. Очистите кэш Facebook: [developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug)

---

## 📚 Полная документация

Полная документация находится в файле: `/SEO_GUIDE.md`

**Дата создания:** 31 марта 2025  
**Версия:** 1.0
