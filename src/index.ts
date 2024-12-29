import cron from 'node-cron';
import { main } from './main.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { TelegramService } from './telegram/telegram.js';
import { DatabaseManager } from './db/db.js';
import { MarketRepository } from './markets/markets.js';
import { MarketFilter } from './markets/market-filter.js';
import { ReportRepository } from './reports/reports.js';
import { SubscriberRepository } from './telegram/subscribers.js';
import { DatabaseError } from './errors.js';

function createDependencies() {
  const dbManager = new DatabaseManager();

  if (!dbManager.isHealthy()) {
    throw new DatabaseError('Database connection is not healthy');
  }

  const marketRepository = new MarketRepository(dbManager);
  const reportRepository = new ReportRepository(dbManager);
  const marketFilter = new MarketFilter();
  const subscriberRepository = new SubscriberRepository(dbManager);
  const telegramService = new TelegramService(subscriberRepository);

  return {
    dbManager,
    telegramService,
    marketRepository,
    reportRepository,
    marketFilter,
  };
}

async function startup() {
  const dependencies = createDependencies();
  const { telegramService, dbManager } = dependencies;

  try {
    logger.info('Starting application...');
    await telegramService.start();
    logger.info('Telegram service started.');

    cron.schedule(config.CRON_SCHEDULE, () => {
      logger.info('Cron job started');
      main(dependencies).catch((error) => {
        logger.error(error, 'Cron job failed:');
      });
    });

    await main(dependencies);
    logger.info('Initial run completed.');
  } catch (error) {
    logger.error(error, 'Startup failed:');
    throw error;
  }

  // Handle graceful shutdown
  const shutdown = async (exitCode = 0) => {
    try {
      telegramService.stop();
      dbManager.close();
      logger.info('Application shutdown complete.');
    } finally {
      process.exit(exitCode);
    }
  };

  process.once('SIGINT', () => shutdown(0));
  process.once('SIGTERM', () => shutdown(0));
}

startup().catch((error) => {
  logger.error(error, 'Critical startup error:');
  process.exit(1);
});
