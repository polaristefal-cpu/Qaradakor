# 📝 Примеры добавления SEO компонента на страницы

## 🎬 Страница фильма (`/src/app/pages/movie-detail.tsx`)

```tsx
import { SEO, generateMovieStructuredData } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function MovieDetailPage() {
  const { lang } = useLang();
  const [movie, setMovie] = useState<any>(null);
  
  // ... ваш код загрузки фильма ...
  
  if (!movie) return <Loader />;
  
  // Формируем данные для SEO
  const movieTitle = lang === "ru" ? movie.title : 
                     lang === "kk" ? (movie.title || movie.original_title) : 
                     movie.original_title;
  
  const movieDescription = movie.overview || 
    (lang === "ru" ? `Смотрите ${movie.title} на Qaradakor.kz` :
     lang === "kk" ? `${movie.title} фильмін Qaradakor.kz-де көріңіз` :
     `Watch ${movie.original_title} on Qaradakor.kz`);
  
  const ogImage = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : undefined;
  
  // Структурированные данные
  const structuredData = generateMovieStructuredData({
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    genres: movie.genres,
    runtime: movie.runtime,
    // Если у вас есть данные о режиссёре и актёрах:
    director: credits?.crew?.find((c: any) => c.job === "Director")?.name,
    actors: credits?.cast?.slice(0, 5).map((c: any) => c.name),
  });

  return (
    <>
      <SEO
        title={`${movieTitle} (${movie.release_date?.slice(0, 4) || ""}) — Qaradakor.kz`}
        description={movieDescription}
        keywords={[
          movieTitle,
          movie.original_title,
          ...(movie.genres?.map((g: any) => g.name) || []),
          "фильм онлайн",
          "кино",
          "qaradakor",
        ]}
        ogImage={ogImage}
        ogType="video.movie"
        canonical={`https://qaradakor.sofine.kz/movie/${movie.id}`}
        structuredData={structuredData}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

---

## 📺 Страница сериала (`/src/app/pages/tv-detail.tsx`)

```tsx
import { SEO, generateTVStructuredData } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function TVDetailPage() {
  const { lang } = useLang();
  const [tv, setTv] = useState<any>(null);
  
  // ... ваш код загрузки сериала ...
  
  if (!tv) return <Loader />;
  
  const tvTitle = lang === "ru" ? tv.name : 
                  lang === "kk" ? (tv.name || tv.original_name) : 
                  tv.original_name;
  
  const tvDescription = tv.overview || 
    (lang === "ru" ? `Смотрите сериал ${tv.name} на Qaradakor.kz` :
     lang === "kk" ? `${tv.name} сериалын Qaradakor.kz-де көріңіз` :
     `Watch ${tv.original_name} on Qaradakor.kz`);
  
  const ogImage = tv.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`
    : tv.poster_path
    ? `https://image.tmdb.org/t/p/w780${tv.poster_path}`
    : undefined;
  
  const structuredData = generateTVStructuredData({
    id: tv.id,
    name: tv.name,
    overview: tv.overview,
    poster_path: tv.poster_path,
    first_air_date: tv.first_air_date,
    vote_average: tv.vote_average,
    vote_count: tv.vote_count,
    genres: tv.genres,
    number_of_seasons: tv.number_of_seasons,
    number_of_episodes: tv.number_of_episodes,
  });

  return (
    <>
      <SEO
        title={`${tvTitle} (${tv.first_air_date?.slice(0, 4) || ""}) — Qaradakor.kz`}
        description={tvDescription}
        keywords={[
          tvTitle,
          tv.original_name,
          ...(tv.genres?.map((g: any) => g.name) || []),
          "сериал онлайн",
          "сериалы",
          "qaradakor",
        ]}
        ogImage={ogImage}
        ogType="video.tv_show"
        canonical={`https://qaradakor.sofine.kz/tv/${tv.id}`}
        structuredData={structuredData}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

---

## 👤 Страница персоны (`/src/app/pages/person.tsx`)

```tsx
import { SEO, generatePersonStructuredData } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function PersonPage() {
  const { lang } = useLang();
  const [person, setPerson] = useState<any>(null);
  
  // ... ваш код загрузки персоны ...
  
  if (!person) return <Loader />;
  
  const personDescription = person.biography 
    ? person.biography.slice(0, 160) + "..."
    : `${person.name} — ${person.known_for_department || "Actor/Actress"} на Qaradakor.kz`;
  
  const ogImage = person.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : undefined;
  
  const structuredData = generatePersonStructuredData({
    id: person.id,
    name: person.name,
    biography: person.biography,
    profile_path: person.profile_path,
    birthday: person.birthday,
    known_for_department: person.known_for_department,
  });

  return (
    <>
      <SEO
        title={`${person.name} — Qaradakor.kz`}
        description={personDescription}
        keywords={[
          person.name,
          person.known_for_department || "actor",
          "биография",
          "фильмография",
          "qaradakor",
        ]}
        ogImage={ogImage}
        ogType="article"
        canonical={`https://qaradakor.sofine.kz/person/${person.id}`}
        structuredData={structuredData}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

---

## 🔍 Страница поиска (`/src/app/pages/search.tsx`)

```tsx
import { SEO } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function SearchPage() {
  const { lang, t } = useLang();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  
  // ... ваш код поиска ...
  
  const pageTitle = query 
    ? `${t("searchResults")}: "${query}" — Qaradakor.kz`
    : `${t("search")} — Qaradakor.kz`;
  
  const pageDescription = query
    ? `Результаты поиска по запросу "${query}". Найдено фильмов и сериалов: ${results.length}`
    : "Поиск фильмов, сериалов, актёров и режиссёров на Qaradakor.kz";

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={["поиск фильмов", "поиск сериалов", "qaradakor", query].filter(Boolean)}
        noindex={!!query} // Страницы результатов поиска обычно не индексируют
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

---

## 📚 Страница коллекций (`/src/app/pages/collections.tsx`)

```tsx
import { SEO } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function CollectionsPage() {
  const { lang, t } = useLang();
  const [collections, setCollections] = useState([]);
  
  // ... ваш код загрузки коллекций ...

  return (
    <>
      <SEO
        title={`${t("collections")} — Qaradakor.kz`}
        description={lang === "ru" 
          ? "Изучайте подборки фильмов и сериалов от пользователей Qaradakor.kz. Лучшие коллекции по жанрам, годам, темам и настроению."
          : lang === "kk"
          ? "Qaradakor.kz пайдаланушыларының фильмдер мен сериалдар жинақтарын зерттеңіз."
          : "Explore movie and TV show collections from Qaradagor.kz users."
        }
        keywords={["коллекции фильмов", "подборки фильмов", "топ фильмов", "qaradakor"]}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

---

## 📖 Детальная страница коллекции (`/src/app/pages/collection-detail.tsx`)

```tsx
import { SEO } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function CollectionDetailPage() {
  const { lang } = useLang();
  const [collection, setCollection] = useState<any>(null);
  
  // ... ваш код загрузки коллекции ...
  
  if (!collection) return <Loader />;
  
  const collectionDescription = collection.description 
    || `Подборка фильмов "${collection.name}" на Qaradakor.kz. ${collection.movies_count || 0} фильмов.`;

  return (
    <>
      <SEO
        title={`${collection.name} — Коллекция фильмов — Qaradakor.kz`}
        description={collectionDescription}
        keywords={[
          collection.name,
          "коллекция фильмов",
          "подборка",
          "qaradakor",
        ]}
        // Индексируем только публичные коллекции
        noindex={!collection.is_public}
        canonical={`https://qaradakor.sofine.kz/collections/${collection.id}`}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

---

## 🔒 Приватные страницы (с noindex)

### Профиль пользователя (`/src/app/pages/profile.tsx`)

```tsx
import { SEO } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function ProfilePage() {
  const { t } = useLang();

  return (
    <>
      <SEO
        title={`${t("profile")} — Qaradakor.kz`}
        noindex={true}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

### Библиотека (`/src/app/pages/library.tsx`)

```tsx
import { SEO } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function LibraryPage() {
  const { t } = useLang();

  return (
    <>
      <SEO
        title={`${t("library")} — Qaradakor.kz`}
        noindex={true}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

### Список просмотра (`/src/app/pages/watchlist.tsx`)

```tsx
import { SEO } from "../components/seo";
import { useLang } from "../lib/lang-context";

export function WatchlistPage() {
  const { t } = useLang();

  return (
    <>
      <SEO
        title={`${t("watchlist")} — Qaradakor.kz`}
        noindex={true}
      />
      
      {/* Ваш UI */}
      <div>...</div>
    </>
  );
}
```

---

## 📝 Общие советы

### 1. Title теги
```tsx
// ✅ Хорошо: уникальный, информативный, с брендом
title={`${movie.title} (${year}) — Qaradakor.kz`}

// ❌ Плохо: слишком короткий
title={movie.title}

// ❌ Плохо: слишком длинный (> 60 символов)
title={`Смотреть фильм ${movie.title} онлайн бесплатно в хорошем качестве HD 1080p на русском языке`}
```

### 2. Description
```tsx
// ✅ Хорошо: информативный, уникальный, 150-160 символов
description={`${movie.overview.slice(0, 140)}... Рейтинг: ${movie.vote_average}/10`}

// ❌ Плохо: копирует другие страницы
description="Смотрите лучшие фильмы на Qaradakor.kz"

// ❌ Плохо: слишком короткий (< 120 символов)
description={movie.title}
```

### 3. Keywords
```tsx
// ✅ Хорошо: релевантные, не spam
keywords={[movie.title, movie.original_title, ...movie.genres.map(g => g.name), "qaradakor"]}

// ❌ Плохо: keyword stuffing
keywords={["фильм", "кино", "смотреть", "онлайн", "бесплатно", "HD", ...]} // слишком много
```

### 4. OG Images
```tsx
// ✅ Хорошо: высокое качество, правильный размер
ogImage={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}

// ❌ Плохо: низкое качество
ogImage={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}

// ✅ Fallback, если нет изображения
ogImage={movie.backdrop_path 
  ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
  : "https://qaradakor.sofine.kz/og-image.jpg"
}
```

### 5. Conditional SEO
```tsx
// Показываем разный контент для авторизованных/неавторизованных
const { session } = useAuth();

const description = session
  ? `Ваша личная библиотека фильмов на Qaradakor.kz`
  : `Создайте учётную запись и начните отслеживать фильмы на Qaradakor.kz`;
```

---

## 🚀 Быстрый старт

### Шаг 1: Импортируйте компонент
```tsx
import { SEO } from "../components/seo";
```

### Шаг 2: Добавьте в начало JSX
```tsx
return (
  <>
    <SEO title="..." description="..." />
    {/* Остальной UI */}
  </>
);
```

### Шаг 3: Проверьте
1. Откройте страницу
2. Нажмите `Ctrl+U` (View Source)
3. Найдите теги `<title>`, `<meta name="description">`, `<meta property="og:*">`
4. Проверьте в [opengraphcheck.com](https://opengraphcheck.com)

---

## ✅ Чек-лист для каждой страницы

- [ ] SEO компонент импортирован
- [ ] SEO компонент добавлен в JSX
- [ ] Title уникальный и информативный (50-60 символов)
- [ ] Description уникальный (150-160 символов)
- [ ] Keywords релевантные (не более 10)
- [ ] OG Image указан (для публичных страниц)
- [ ] noindex установлен правильно (true для приватных)
- [ ] Структурированные данные добавлены (если применимо)
- [ ] Canonical URL указан корректно
- [ ] Проверено в браузере (Ctrl+U)
- [ ] Проверено в opengraphcheck.com

---

**Дата создания:** 31 марта 2025  
**Версия:** 1.0

**🎯 Цель:** Добавить SEO на ВСЕ основные страницы в течение недели!
