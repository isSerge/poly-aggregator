import cron from 'node-cron';
import { main } from './main.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { TelegramService } from './telegram/telegram.js';

const telegramService = new TelegramService();

async function startup() {
  await telegramService.start();

  cron.schedule(config.CRON_SCHEDULE, () => main(telegramService));
  await main(telegramService);
}

// Handle graceful shutdown
process.once('SIGINT', () => {
  telegramService.stop();
  process.exit(0);
});

process.once('SIGTERM', () => {
  telegramService.stop();
  process.exit(0);
});

startup().catch((error) => {
  logger.error('Startup failed:', error);
  process.exit(1);
});
