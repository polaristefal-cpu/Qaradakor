/**
 * Пример сервера для обработки sitemap запросов
 * 
 * УСТАНОВКА:
 * npm install express
 * 
 * ЗАПУСК:
 * node sitemap-server.js
 */

import express from 'express';
import cors from 'cors';

// Импортируем функции генерации sitemap
// ВАЖНО: Путь может отличаться в зависимости от вашей структуры проекта
import {
  generateMainSitemap,
  generateMoviesSitemap,
  generateTVSitemap,
  generateCollectionsSitemap,
  generateSitemapIndex,
} from './src/app/lib/sitemap.ts';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Sitemap Routes ──────────────────────────────────────────────────────────

/**
 * Основной sitemap со статическими страницами
 */
app.get('/sitemap.xml', async (req, res) => {
  try {
    console.log('[Sitemap] Generating main sitemap...');
    const xml = generateMainSitemap();
    
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(xml);
    
    console.log('[Sitemap] Main sitemap generated successfully');
  } catch (error) {
    console.error('[Sitemap] Error generating main sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Sitemap с популярными фильмами
 */
app.get('/sitemap-movies.xml', async (req, res) => {
  try {
    console.log('[Sitemap] Generating movies sitemap...');
    const xml = await generateMoviesSitemap();
    
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
    
    console.log('[Sitemap] Movies sitemap generated successfully');
  } catch (error) {
    console.error('[Sitemap] Error generating movies sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Sitemap с популярными сериалами
 */
app.get('/sitemap-tv.xml', async (req, res) => {
  try {
    console.log('[Sitemap] Generating TV shows sitemap...');
    const xml = await generateTVSitemap();
    
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
    
    console.log('[Sitemap] TV shows sitemap generated successfully');
  } catch (error) {
    console.error('[Sitemap] Error generating TV shows sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Sitemap с публичными коллекциями
 */
app.get('/sitemap-collections.xml', async (req, res) => {
  try {
    console.log('[Sitemap] Generating collections sitemap...');
    const xml = await generateCollectionsSitemap();
    
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
    
    console.log('[Sitemap] Collections sitemap generated successfully');
  } catch (error) {
    console.error('[Sitemap] Error generating collections sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Sitemap index — ссылки на все остальные sitemap'ы
 */
app.get('/sitemap-index.xml', async (req, res) => {
  try {
    console.log('[Sitemap] Generating sitemap index...');
    const xml = generateSitemapIndex();
    
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
    
    console.log('[Sitemap] Sitemap index generated successfully');
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ─── Error Handling ──────────────────────────────────────────────────────────

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      '/sitemap.xml',
      '/sitemap-movies.xml',
      '/sitemap-tv.xml',
      '/sitemap-collections.xml',
      '/sitemap-index.xml',
    ],
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║  🚀 Qaradakor.kz Sitemap Server                       ║');
  console.log('║                                                       ║');
  console.log(`║  📡 Server running on: http://localhost:${PORT}        ║`);
  console.log('║                                                       ║');
  console.log('║  Available endpoints:                                 ║');
  console.log(`║  • http://localhost:${PORT}/sitemap.xml              ║`);
  console.log(`║  • http://localhost:${PORT}/sitemap-movies.xml       ║`);
  console.log(`║  • http://localhost:${PORT}/sitemap-tv.xml           ║`);
  console.log(`║  • http://localhost:${PORT}/sitemap-collections.xml  ║`);
  console.log(`║  • http://localhost:${PORT}/sitemap-index.xml        ║`);
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
