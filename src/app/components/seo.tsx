import { useEffect } from "react";
import { useLang } from "../lib/lang-context";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: "website" | "article" | "video.movie" | "video.tv_show";
  noindex?: boolean;
  canonical?: string;
  structuredData?: object;
}

/**
 * Компонент для управления SEO meta-тегами
 * Используйте на каждой странице для установки правильных метаданных
 */
export function SEO({
  title,
  description,
  keywords = [],
  ogImage,
  ogType = "website",
  noindex = false,
  canonical,
  structuredData,
}: SEOProps) {
  const { lang } = useLang();
  const baseUrl = "https://qaradakor.kz";
  
  // Дефолтные значения
  const defaultTitle = {
    ru: "Qaradakor.kz — Персональная библиотека фильмов",
    kk: "Qaradakor.kz — Жеке кино кітапханасы",
    en: "Qaradakor.kz — Your Personal Movie Library",
  };
  
  const defaultDescription = {
    ru: "Откройте для себя мир кино с qaradakor.kz — современной платформой для поиска, изучения и отслеживания фильмов и сериалов с AI-рекомендациями на казахском, русском и английском языках.",
    kk: "Qaradakor.kz арқылы кино әлеміне саяхат жасаңыз — фильмдер мен сериалдарды іздеуге, зерттеуге және бақылауға арналған заманауи платформа қазақ, орыс және ағылшын тілдерінде AI ұсыныстарымен.",
    en: "Discover the world of cinema with qaradakor.kz — a modern platform for searching, exploring, and tracking movies and TV shows with AI recommendations in Kazakh, Russian, and English.",
  };
  
  const defaultOgImage = `${baseUrl}/og-image.png`;
  
  const pageTitle = title || defaultTitle[lang];
  const pageDescription = description || defaultDescription[lang];
  const pageOgImage = ogImage || defaultOgImage;
  
  useEffect(() => {
    // Обновляем title
    document.title = pageTitle;
    
    // Обновляем или создаём meta-теги
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };
    
    // Основные meta-теги
    updateMetaTag("description", pageDescription);
    
    if (keywords.length > 0) {
      updateMetaTag("keywords", keywords.join(", "));
    }
    
    updateMetaTag("robots", noindex ? "noindex, nofollow" : "index, follow");
    
    // Open Graph meta-теги
    updateMetaTag("og:title", pageTitle, true);
    updateMetaTag("og:description", pageDescription, true);
    updateMetaTag("og:image", pageOgImage, true);
    updateMetaTag("og:type", ogType, true);
    updateMetaTag("og:url", canonical || window.location.href, true);
    updateMetaTag("og:locale", lang === "kk" ? "kk_KZ" : lang === "ru" ? "ru_RU" : "en_US", true);
    
    // Twitter Card meta-теги
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", pageTitle);
    updateMetaTag("twitter:description", pageDescription);
    updateMetaTag("twitter:image", pageOgImage);
    
    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    
    canonicalLink.href = canonical || window.location.href.split("?")[0];
    
    // Альтернативные языковые версии (hreflang)
    const removeExistingHreflangs = () => {
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    };
    
    removeExistingHreflangs();
    
    const currentPath = window.location.pathname;
    const langs = ["ru", "kk", "en"];
    
    langs.forEach((l) => {
      const hreflangLink = document.createElement("link");
      hreflangLink.rel = "alternate";
      hreflangLink.hreflang = l;
      hreflangLink.href = `${baseUrl}${currentPath}?lang=${l}`;
      document.head.appendChild(hreflangLink);
    });
    
    // x-default для международной версии
    const xDefaultLink = document.createElement("link");
    xDefaultLink.rel = "alternate";
    xDefaultLink.hreflang = "x-default";
    xDefaultLink.href = `${baseUrl}${currentPath}`;
    document.head.appendChild(xDefaultLink);
    
    // Structured Data (JSON-LD)
    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      
      scriptTag.textContent = JSON.stringify(structuredData);
    }
  }, [
    pageTitle,
    pageDescription,
    keywords,
    pageOgImage,
    ogType,
    noindex,
    canonical,
    structuredData,
    lang,
  ]);
  
  return null;
}

/**
 * Генерирует структурированные данные для фильма
 */
export function generateMovieStructuredData(movie: {
  id: number;
  title: string;
  overview: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: { id: number; name: string }[];
  runtime?: number;
  director?: string;
  actors?: string[];
}) {
  const baseUrl = "https://qaradakor.kz";
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : undefined;
  
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.overview,
    image: imageUrl,
    datePublished: movie.release_date,
    url: `${baseUrl}/movie/${movie.id}`,
    aggregateRating: movie.vote_average
      ? {
          "@type": "AggregateRating",
          ratingValue: movie.vote_average,
          ratingCount: movie.vote_count,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined,
    genre: movie.genres?.map((g) => g.name),
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    director: movie.director
      ? {
          "@type": "Person",
          name: movie.director,
        }
      : undefined,
    actor: movie.actors?.map((name) => ({
      "@type": "Person",
      name,
    })),
  };
}

/**
 * Генерирует структурированные данные для сериала
 */
export function generateTVStructuredData(tv: {
  id: number;
  name: string;
  overview: string;
  poster_path?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}) {
  const baseUrl = "https://qaradakor.kz";
  const imageUrl = tv.poster_path
    ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
    : undefined;
  
  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: tv.name,
    description: tv.overview,
    image: imageUrl,
    datePublished: tv.first_air_date,
    url: `${baseUrl}/tv/${tv.id}`,
    aggregateRating: tv.vote_average
      ? {
          "@type": "AggregateRating",
          ratingValue: tv.vote_average,
          ratingCount: tv.vote_count,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined,
    genre: tv.genres?.map((g) => g.name),
    numberOfSeasons: tv.number_of_seasons,
    numberOfEpisodes: tv.number_of_episodes,
  };
}

/**
 * Генерирует структурированные данные для персоны (актёр/режиссёр)
 */
export function generatePersonStructuredData(person: {
  id: number;
  name: string;
  biography?: string;
  profile_path?: string;
  birthday?: string;
  known_for_department?: string;
}) {
  const baseUrl = "https://qaradakor.kz";
  const imageUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : undefined;
  
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    description: person.biography,
    image: imageUrl,
    birthDate: person.birthday,
    url: `${baseUrl}/person/${person.id}`,
    jobTitle: person.known_for_department,
  };
}

/**
 * Генерирует структурированные данные для организации (главная страница)
 */
export function generateOrganizationStructuredData() {
  const baseUrl = "https://qaradakor.kz";
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Qaradakor.kz",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      // Добавьте ссылки на социальные сети, если есть
      // "https://www.facebook.com/qaradakor",
      // "https://twitter.com/qaradakor",
      // "https://www.instagram.com/qaradakor",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      availableLanguage: ["Russian", "Kazakh", "English"],
    },
  };
}

/**
 * Генерирует структурированные данные для WebSite (поиск)
 */
export function generateWebSiteStructuredData() {
  const baseUrl = "https://qaradakor.kz";
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Qaradakor.kz",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
