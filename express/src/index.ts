import express from 'express';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from './env';
import { cors } from './middleware/cors';
import { traceId } from './middleware/trace-id';
import { securityHeaders } from './middleware/security-headers';
import { rateLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error-handler';
import cookieParser from 'cookie-parser';
import { logger } from './shared/logger';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  const app = express();

  app.use(cors);
  app.use(traceId);
  app.use(securityHeaders);
  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(rateLimiter);

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'OK' });
  });

  // Convention-based auto-discovery
  const featuresDir = join(__dirname, 'features');
  let mountedCount = 0;

  for (const dirent of readdirSync(featuresDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const folderName = dirent.name;

    try {
      const routeModule = await import(join(featuresDir, folderName, 'routes', 'index.ts'));
      const router = routeModule.default;

      if (router) {
        const apiPath = `/api/v1/${folderName}`;
        app.use(apiPath, router);
        logger.debug(`  ✓ Mounted ${apiPath}`);
        mountedCount++;
      }
    } catch {
      // Feature has no routes/index.ts — skip silently
    }
  }

  logger.debug(`\nMounted ${mountedCount} feature router(s)`);

  app.use(errorHandler);

  app.listen(env.PORT, () => {
    logger.debug(`\n🚀 Express API running on http://localhost:${env.PORT}`);
    logger.debug(`   Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
