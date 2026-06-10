/**
 * API Routes для генерации sitemap
 * 
 * Эти endpoints должны быть настроены на вашем сервере (например, через Vite SSR или отдельный Express сервер)
 * 
 * Пример использования с Express:
 * 
 * import express from 'express';
 * import { 
 *   generateMainSitemap,
 *   generateMoviesSitemap,
 *   generateTVSitemap,
 *   generateCollectionsSitemap,
 *   generateSitemapIndex
 * } from './src/app/lib/sitemap';
 * 
 * const app = express();
 * 
 * // Основной sitemap
 * app.get('/sitemap.xml', async (req, res) => {
 *   res.header('Content-Type', 'application/xml');
 *   const xml = generateMainSitemap();
 *   res.send(xml);
 * });
 * 
 * // Sitemap с фильмами
 * app.get('/sitemap-movies.xml', async (req, res) => {
 *   res.header('Content-Type', 'application/xml');
 *   const xml = await generateMoviesSitemap();
 *   res.send(xml);
 * });
 * 
 * // Sitemap с сериалами
 * app.get('/sitemap-tv.xml', async (req, res) => {
 *   res.header('Content-Type', 'application/xml');
 *   const xml = await generateTVSitemap();
 *   res.send(xml);
 * });
 * 
 * // Sitemap с коллекциями
 * app.get('/sitemap-collections.xml', async (req, res) => {
 *   res.header('Content-Type', 'application/xml');
 *   const xml = await generateCollectionsSitemap();
 *   res.send(xml);
 * });
 * 
 * // Sitemap index
 * app.get('/sitemap-index.xml', async (req, res) => {
 *   res.header('Content-Type', 'application/xml');
 *   const xml = generateSitemapIndex();
 *   res.send(xml);
 * });
 */

// Для Vite SSR или другого окружения можно использовать следующую структуру:

import {
  generateMainSitemap,
  generateMoviesSitemap,
  generateTVSitemap,
  generateCollectionsSitemap,
  generateSitemapIndex,
} from "../lib/sitemap";

export async function handleSitemapRequest(path: string): Promise<{ xml: string }> {
  let xml = "";
  
  switch (path) {
    case "/sitemap.xml":
      xml = generateMainSitemap();
      break;
      
    case "/sitemap-movies.xml":
      xml = await generateMoviesSitemap();
      break;
      
    case "/sitemap-tv.xml":
      xml = await generateTVSitemap();
      break;
      
    case "/sitemap-collections.xml":
      xml = await generateCollectionsSitemap();
      break;
      
    case "/sitemap-index.xml":
      xml = generateSitemapIndex();
      break;
      
    default:
      throw new Error("Unknown sitemap path");
  }
  
  return { xml };
}

/**
 * Middleware для обработки sitemap запросов в Vite dev server
 */
export function sitemapMiddleware() {
  return async (req: any, res: any, next: any) => {
    const url = req.url;
    
    if (url.startsWith("/sitemap") && url.endsWith(".xml")) {
      try {
        const { xml } = await handleSitemapRequest(url);
        res.setHeader("Content-Type", "application/xml");
        res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
        res.end(xml);
      } catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).end("Error generating sitemap");
      }
    } else {
      next();
    }
  };
}
