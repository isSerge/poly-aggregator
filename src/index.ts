import cron from 'node-cron';
import { main } from './main.js';
import { config } from './config.js';

// Schedule the main function to run every minute
cron.schedule(config.CRON_SCHEDULE, main);

main();
