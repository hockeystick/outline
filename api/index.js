/**
 * Vercel Serverless Function Entry Point
 *
 * This wraps the Outline Koa app for Vercel's serverless environment.
 *
 * LIMITATIONS:
 * - WebSockets won't work (collaboration features disabled)
 * - Real-time collaboration will not function
 * - Background workers and cron jobs won't run
 * - Cold starts will be slower
 * - This is NOT the recommended way to deploy Outline
 *
 * For production use, consider: Railway, Render, Fly.io, or DigitalOcean
 */

const path = require('path');

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Disable services that don't work in serverless
// Only enable 'web' service for basic HTTP requests
process.env.SERVICES = process.env.SERVICES || 'web';
process.env.WEB_CONCURRENCY = '1';

let app;
let isInitialized = false;

async function getApp() {
  if (app && isInitialized) {
    return app;
  }

  try {
    console.log('Initializing Outline server for Vercel...');

    // Import the routes app (this is a pre-configured Koa instance)
    const routesPath = path.join(__dirname, '..', 'build', 'server', 'routes', 'index.js');
    const routesModule = require(routesPath);
    app = routesModule.default || routesModule;

    isInitialized = true;
    console.log('Outline server initialized successfully');

    return app;
  } catch (error) {
    console.error('Failed to initialize Outline server:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const koaApp = await getApp();

    // Convert Vercel request to Koa callback
    const callback = koaApp.callback();
    return callback(req, res);

  } catch (error) {
    console.error('Error handling request:', error);

    // Return proper error response
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Server initialization failed',
      details: 'Check Vercel function logs for details. Ensure DATABASE_URL and REDIS_URL are configured correctly.'
    }));
  }
};
