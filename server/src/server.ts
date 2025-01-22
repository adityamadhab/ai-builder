import app from './app';
import { disconnectDB } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await disconnectDB();
  server.close(() => {
    logger.info('🔴 Server stopped');
    process.exit(0);
  });
});