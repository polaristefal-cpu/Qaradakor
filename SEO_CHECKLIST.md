# ✅ SEO Чек-лист для Qaradakor.kz

## 📋 Базовая настройка

### Файлы и структура
- [x] `/public/robots.txt` создан
- [x] `/src/app/lib/sitemap.ts` создан
- [x] `/src/app/lib/sitemap-routes.ts` создан
- [x] `/src/app/components/seo.tsx` создан
- [x] `/public/site.webmanifest` создан
- [x] `/index.html` обновлён с meta-тегами
- [x] `/src/app/pages/home.tsx` — добавлен SEO компонент
- [x] `/vite.config.ts` — настроена директория public

---

## 🖼️ Изображения (КРИТИЧНО — нужно создать)

- [ ] `/public/og-image.jpg` (1200x630px)
- [ ] `/public/logo.png` (512x512px)
- [ ] `/public/favicon.ico` (32x32px)
- [ ] `/public/favicon-16x16.png`
- [ ] `/public/favicon-32x32.png`
- [ ] `/public/apple-touch-icon.png` (180x180px)
- [ ] `/public/android-chrome-192x192.png`
- [ ] `/public/android-chrome-512x512.png`

**Инструменты:**
- [Favicon Generator](https://realfavicongenerator.net)
- [OG Image Generator](https://www.bannerbear.com/tools/og-image-generator/)
- [Canva](https://www.canva.com/) для создания изображений

---

## 🌐 Серверная настройка

### Выбор способа (выберите один)

#### Вариант A: Express Server
- [ ] Установить: `npm install express cors`
- [ ] Скопировать `/sitemap-server.example.js` в `/sitemap-server.js`
- [ ] Настроить импорты
- [ ] Запустить: `node sitemap-server.js`
- [ ] Проверить: `http://localhost:3001/sitemap.xml`

#### Вариант B: Vercel Serverless
- [ ] Создать папку `/api/`
- [ ] Создать файлы:
  - [ ] `/api/sitemap.ts`
  - [ ] `/api/sitemap-movies.ts`
  - [ ] `/api/sitemap-tv.ts`
  - [ ] `/api/sitemap-collections.ts`
- [ ] Задеплоить на Vercel
- [ ] Настроить rewrites в `vercel.json`

#### Вариант C: Nginx Proxy
- [ ] Настроить nginx config
- [ ] Создать upstream для sitemap сервера
- [ ] Настроить location `/sitemap*.xml`
- [ ] Перезапустить nginx

---

## 📄 SEO на страницах

### Главные страницы
- [x] Главная (`/`) — SEO добавлен ✅
- [ ] Поиск (`/search`) — нужно добавить
- [ ] Коллекции (`/collections`) — нужно добавить

### Динамические страницы
- [ ] Фильм (`/movie/:id`) — нужно добавить
- [ ] Сериал (`/tv/:id`) — нужно добавить  
- [ ] Персона (`/person/:id`) — нужно добавить
- [ ] Коллекция (`/collections/:id`) — нужно добавить

### Приватные страницы (с noindex)
- [ ] Профиль (`/profile`)
- [ ] Библиотека (`/library`)
- [ ] Список просмотра (`/watchlist`)
- [ ] Друзья (`/friends`)
- [ ] AI Чат (`/ai`)

---

## 🔍 Регистрация в поисковиках

### Google Search Console
- [ ] Зайти на [search.google.com/search-console](https://search.google.com/search-console)
- [ ] Добавить сайт `qaradakor.sofine.kz`
- [ ] Подтвердить владение (HTML файл / DNS)
- [ ] Отправить sitemap: `https://qaradakor.sofine.kz/sitemap-index.xml`
- [ ] Дождаться индексации (1-2 недели)

### Yandex Webmaster
- [ ] Зайти на [webmaster.yandex.ru](https://webmaster.yandex.ru)
- [ ] Добавить сайт
- [ ] Подтвердить владение
- [ ] Отправить sitemap
- [ ] Настроить регион: Казахстан

### Bing Webmaster Tools (опционально)
- [ ] Зайти на [www.bing.com/webmasters](https://www.bing.com/webmasters)
- [ ] Добавить сайт
- [ ] Импортировать данные из Google Search Console

---

## 🧪 П��оверка и тестирование

### Базовая проверка
- [ ] Открыть `https://qaradakor.sofine.kz/robots.txt` — работает?
- [ ] Открыть `https://qaradakor.sofine.kz/site.webmanifest` — работает?
- [ ] Открыть `https://qaradakor.sofine.kz/sitemap.xml` — работает?
- [ ] Посмотреть исходный код главной страницы (Ctrl+U)
  - [ ] Есть `<title>` тег?
  - [ ] Есть `<meta name="description">`?
  - [ ] Есть Open Graph теги (`og:*`)?
  - [ ] Есть структурированные данные (JSON-LD)?

### Онлайн инструменты

#### Open Graph & Twitter Cards
- [ ] [opengraphcheck.com](https://opengraphcheck.com) — проверить OG
- [ ] [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator) — проверить Twitter Cards
- [ ] [www.opengraph.xyz](https://www.opengraph.xyz) — альтернатива

#### Структурированные данные
- [ ] [search.google.com/test/rich-results](https://search.google.com/test/rich-results) — Rich Results Test
- [ ] [validator.schema.org](https://validator.schema.org/) — Schema.org Validator

#### Производительность
- [ ] [pagespeed.web.dev](https://pagespeed.web.dev) — PageSpeed Insights
  - Цель: Desktop > 90, Mobile > 70
- [ ] [web.dev/measure](https://web.dev/measure/) — Lighthouse
- [ ] [gtmetrix.com](https://gtmetrix.com/) — GTmetrix

#### Мобильная версия
- [ ] [search.google.com/test/mobile-friendly](https://search.google.com/test/mobile-friendly) — Mobile-Friendly Test
- [ ] Проверить на реальном мобильном устройстве

#### Robots.txt
- [ ] [support.google.com/webmasters/answer/6062598](https://support.google.com/webmasters/answer/6062598) — Robots Testing Tool

#### Sitemap
- [ ] [www.xml-sitemaps.com/validate-xml-sitemap.html](https://www.xml-sitemaps.com/validate-xml-sitemap.html) — Sitemap Validator

---

## 📊 Аналитика (опционально)

### Google Analytics
- [ ] Создать аккаунт GA4
- [ ] Получить Measurement ID (G-XXXXXXXXXX)
- [ ] Добавить код в `index.html`
- [ ] Проверить отслеживание

### Yandex Metrica
- [ ] Создать счётчик
- [ ] Получить ID счётчика
- [ ] Добавить код в `index.html`
- [ ] Настроить цели (регистрация, просмотры)

### Google Tag Manager (расширенная аналитика)
- [ ] Создать контейнер GTM
- [ ] Установить на сайт
- [ ] Настроить теги (GA, Pixel, и т.д.)

---

## 🚀 Оптимизация и продвижение

### Контент
- [ ] Написать уникальные description для всех основных страниц
- [ ] Добавить alt текст ко всем изображениям
- [ ] Создать страницу "О нас"
- [ ] Создать FAQ страницу
- [ ] Добавить блог/новости (опционально)

### Технические улучшения
- [ ] Настроить CDN (Cloudflare/CloudFront)
- [ ] Включить HTTP/2 или HTTP/3
- [ ] Настроить Gzip/Brotli сжатие
- [ ] Оптимизировать изображения (WebP)
- [ ] Включить lazy loading для изображений
- [ ] Минифицировать CSS/JS

### Локальное SEO (для Казахстана)
- [ ] Добавить Schema.org LocalBusiness (если применимо)
- [ ] Зарегистрировать в 2GIS (если применимо)
- [ ] Создать профиль в социальных сетях
- [ ] Получить обратные ссылки с казахстанских сайтов

### Ссылки и упоминания
- [ ] Разместить в каталогах (Яндекс.Каталог, DMOZ, и т.д.)
- [ ] Написать гостевые посты на профильных блогах
- [ ] Участвовать в форумах о кино
- [ ] Создать канал на YouTube с обзорами

---

## 📱 Google Business Profile

- [ ] Открыть [business.google.com](https://business.google.com)
- [ ] Создать профиль
- [ ] Использовать описание из `/GOOGLE_BUSINESS_DESCRIPTIONS.md`
- [ ] Добавить логотип и обложку
- [ ] Указать категории (Интернет-компания, Развлечения)
- [ ] Добавить ссылки на соцсети
- [ ] Настроить атрибуты (Бесплатно, Онлайн, и т.д.)

---

## 📈 Мониторинг

### Еженедельно
- [ ] Проверить позиции в поиске по ключевым запросам
- [ ] Посмотреть отчёты в Google Search Console
- [ ] Проверить ошибки индексации
- [ ] Посмотреть аналитику (GA/Metrica)

### Ежемесячно
- [ ] Обновить sitemap (если добавились новые страницы)
- [ ] Проанализировать топ-запросы
- [ ] Оптимизировать страницы с низким CTR
- [ ] Проверить обратные ссылки
- [ ] Обновить контент на популярных страницах

### Ежеквартально
- [ ] Провести полный SEO аудит
- [ ] Сравнить с конкурентами
- [ ] Пересмотреть стратегию ключевых слов
- [ ] Обновить структурированные данные (если изменились требования)

---

## 🎯 KPI и цели

### Краткосрочные (1 месяц)
- [ ] Индексация главной страницы
- [ ] Индексация 50+ страниц фильмов
- [ ] Органический трафик > 100 визитов/день
- [ ] CTR из поиска > 2%

### Среднесрочные (3 месяца)
- [ ] Индексация 500+ страниц
- [ ] Топ-30 по запросу "библиотека фильмов"
- [ ] Органический трафик > 500 визитов/день
- [ ] CTR из поиска > 3%

### Долгосрочные (6 месяцев)
- [ ] Индексация 2000+ страниц
- [ ] Топ-10 по запросу "qaradakor"
- [ ] Топ-20 по запросу "кино қазақша"
- [ ] Органический трафик > 2000 визитов/день
- [ ] CTR из поиска > 4%

---

## ⚠️ Распространённые ошибки

### ❌ Чего НЕ делать
- [ ] ❌ Дублировать title/description на разных страницах
- [ ] ❌ Использовать слишком короткие title (< 30 символов)
- [ ] ❌ Игнорировать мобильную версию
- [ ] ❌ Использовать слишком большие изображения (> 500KB)
- [ ] ❌ Скрывать контент от поисковиков
- [ ] ❌ Покупать ссылки (spam)
- [ ] ❌ Копировать контент с других сайтов

### ✅ Что ОБЯЗАТЕЛЬНО делать
- [x] ✅ Уникальные title и description для каждой страницы
- [x] ✅ Использовать структурированные данные
- [x] ✅ Оптимизировать изображения
- [x] ✅ Делать сайт быстрым (PageSpeed > 70)
- [x] ✅ Регулярно обновлять контент
- [x] ✅ Мониторить ошибки в Search Console
- [x] ✅ Отвечать на отзывы пользователей

---

## 📚 Полезные ресурсы

### Документация
- [SEO_GUIDE.md](/SEO_GUIDE.md) — полная документация
- [SEO_QUICKSTART.md](/SEO_QUICKSTART.md) — быстрый старт
- [SEO_SUMMARY.md](/SEO_SUMMARY.md) — итоговая сводка
- [GOOGLE_BUSINESS_DESCRIPTIONS.md](/GOOGLE_BUSINESS_DESCRIPTIONS.md) — описания

### Официальные гайды
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Yandex SEO Guide](https://yandex.ru/support/webmaster/recommendations/how-to-seo.html)
- [Schema.org Documentation](https://schema.org/docs/documents.html)

### Инструменты
- [Google Search Console](https://search.google.com/search-console)
- [Yandex Webmaster](https://webmaster.yandex.ru)
- [PageSpeed Insights](https://pagespeed.web.dev)
- [GTmetrix](https://gtmetrix.com)

---

## ✅ Финальная проверка

Перед запуском убедитесь:

- [ ] Все изображения созданы и загружены
- [ ] Sitemap endpoints настроены и работают
- [ ] SEO компонент добавлен на все основные страницы
- [ ] Сайт зарегистрирован в Google Search Console
- [ ] Сайт зарегистрирован в Yandex Webmaster
- [ ] Проведено тестирование всех инструментов
- [ ] Аналитика настроена (GA/Metrica)
- [ ] Мобильная версия работает корректно
- [ ] PageSpeed > 70 для мобильных
- [ ] Все ссылки работают (нет 404 ошибок)

---

**Статус:** 🟡 В процессе настройки  
**Прогресс:** 50% (базовая структура готова)  
**Дата создания:** 31 марта 2025  
**Последнее обновление:** 31 марта 2025

---

**🎉 Удачи с продвижением Qaradakor.kz!**
