import { supabase } from "./lib/api";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  alternates?: { lang: string; href: string }[];
}

/**
 * Генерирует XML для одного URL в sitemap
 */
function generateUrlXml(url: SitemapUrl): string {
  const { loc, lastmod, changefreq, priority, alternates } = url;
  
  let xml = "  <url>\n";
  xml += `    <loc>${escapeXml(loc)}</loc>\n`;
  
  if (lastmod) {
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
  }
  
  if (changefreq) {
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
  }
  
  if (priority !== undefined) {
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
  }
  
  // Добавляем альтернативные языковые версии
  if (alternates && alternates.length > 0) {
    for (const alt of alternates) {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${escapeXml(alt.href)}" />\n`;
    }
  }
  
  xml += "  </url>\n";
  return xml;
}

/**
 * Экранирует специальные символы для XML
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Создаёт полный XML sitemap
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  for (const url of urls) {
    xml += generateUrlXml(url);
  }
  
  xml += "</urlset>";
  return xml;
}

/**
 * Генерирует основной sitemap со статическими страницами
 */
export function generateMainSitemap(): string {
  const baseUrl = "https://qaradakor.kz";
  const now = new Date().toISOString().split("T")[0];
  
  const staticPages: SitemapUrl[] = [
    {
      loc: `${baseUrl}/`,
      lastmod: now,
      changefreq: "daily",
      priority: 1.0,
      alternates: [
        { lang: "ru", href: `${baseUrl}/?lang=ru` },
        { lang: "kk", href: `${baseUrl}/?lang=kk` },
        { lang: "en", href: `${baseUrl}/?lang=en` },
      ],
    },
    {
      loc: `${baseUrl}/search`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
      alternates: [
        { lang: "ru", href: `${baseUrl}/search?lang=ru` },
        { lang: "kk", href: `${baseUrl}/search?lang=kk` },
        { lang: "en", href: `${baseUrl}/search?lang=en` },
      ],
    },
    {
      loc: `${baseUrl}/collections`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.7,
      alternates: [
        { lang: "ru", href: `${baseUrl}/collections?lang=ru` },
        { lang: "kk", href: `${baseUrl}/collections?lang=kk` },
        { lang: "en", href: `${baseUrl}/collections?lang=en` },
      ],
    },
  ];
  
  return generateSitemapXml(staticPages);
}

/**
 * Генерирует sitemap index, который ссылается на все остальные sitemap'ы
 */
export function generateSitemapIndex(): string {
  const baseUrl = "https://qaradakor.kz";
  const now = new Date().toISOString();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const sitemaps = [
    { loc: `${baseUrl}/sitemap.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-movies.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-tv.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-collections.xml`, lastmod: now },
  ];
  
  for (const sitemap of sitemaps) {
    xml += "  <sitemap>\n";
    xml += `    <loc>${sitemap.loc}</loc>\n`;
    xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    xml += "  </sitemap>\n";
  }
  
  xml += "</sitemapindex>";
  return xml;
}

/**
 * Получает популярные фильмы из базы данных для sitemap
 */
export async function getPopularMoviesForSitemap(limit = 500): Promise<SitemapUrl[]> {
  try {
    const { data, error } = await supabase
      .from("user_movie_ratings")
      .select("tmdb_movie_id")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching movies for sitemap:", error);
      return [];
    }
    
    const baseUrl = "https://qaradakor.kz";
    const uniqueMovieIds = [...new Set(data?.map((item) => item.tmdb_movie_id) || [])];
    
    return uniqueMovieIds.map((id) => ({
      loc: `${baseUrl}/movie/${id}`,
      changefreq: "weekly" as const,
      priority: 0.6,
      alternates: [
        { lang: "ru", href: `${baseUrl}/movie/${id}?lang=ru` },
        { lang: "kk", href: `${baseUrl}/movie/${id}?lang=kk` },
        { lang: "en", href: `${baseUrl}/movie/${id}?lang=en` },
      ],
    }));
  } catch (err) {
    console.error("Exception in getPopularMoviesForSitemap:", err);
    return [];
  }
}

/**
 * Получает популярные сериалы из базы данных для sitemap
 */
export async function getPopularTVForSitemap(limit = 500): Promise<SitemapUrl[]> {
  try {
    const { data, error } = await supabase
      .from("user_tv_ratings")
      .select("tmdb_tv_id")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching TV shows for sitemap:", error);
      return [];
    }
    
    const baseUrl = "https://qaradakor.kz";
    const uniqueTVIds = [...new Set(data?.map((item) => item.tmdb_tv_id) || [])];
    
    return uniqueTVIds.map((id) => ({
      loc: `${baseUrl}/tv/${id}`,
      changefreq: "weekly" as const,
      priority: 0.6,
      alternates: [
        { lang: "ru", href: `${baseUrl}/tv/${id}?lang=ru` },
        { lang: "kk", href: `${baseUrl}/tv/${id}?lang=kk` },
        { lang: "en", href: `${baseUrl}/tv/${id}?lang=en` },
      ],
    }));
  } catch (err) {
    console.error("Exception in getPopularTVForSitemap:", err);
    return [];
  }
}

/**
 * Получает публичные коллекции для sitemap
 */
export async function getPublicCollectionsForSitemap(limit = 100): Promise<SitemapUrl[]> {
  try {
    const { data, error } = await supabase
      .from("collections")
      .select("id, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching collections for sitemap:", error);
      return [];
    }
    
    const baseUrl = "https://qaradakor.kz";
    
    return (data || []).map((collection) => ({
      loc: `${baseUrl}/collections/${collection.id}`,
      lastmod: collection.updated_at
        ? new Date(collection.updated_at).toISOString().split("T")[0]
        : undefined,
      changefreq: "monthly" as const,
      priority: 0.5,
      alternates: [
        { lang: "ru", href: `${baseUrl}/collections/${collection.id}?lang=ru` },
        { lang: "kk", href: `${baseUrl}/collections/${collection.id}?lang=kk` },
        { lang: "en", href: `${baseUrl}/collections/${collection.id}?lang=en` },
      ],
    }));
  } catch (err) {
    console.error("Exception in getPublicCollectionsForSitemap:", err);
    return [];
  }
}

/**
 * Генерирует sitemap для фильмов
 */
export async function generateMoviesSitemap(): Promise<string> {
  const urls = await getPopularMoviesForSitemap();
  return generateSitemapXml(urls);
}

/**
 * Генерирует sitemap для сериалов
 */
export async function generateTVSitemap(): Promise<string> {
  const urls = await getPopularTVForSitemap();
  return generateSitemapXml(urls);
}

/**
 * Генерирует sitemap для коллекций
 */
export async function generateCollectionsSitemap(): Promise<string> {
  const urls = await getPublicCollectionsForSitemap();
  return generateSitemapXml(urls);
}
