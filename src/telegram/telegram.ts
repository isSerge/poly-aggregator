import { Telegraf } from 'telegraf';
import { logger } from '../logger.js';
import { config } from '../config.js';
import { TelegramError } from '../errors.js';

export class TelegramService {
  private readonly bot: Telegraf;
  private readonly subscribers: Set<number>;

  constructor() {
    try {
      this.bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
    } catch (error) {
      throw TelegramError.from(error, 'Failed to initialize Telegram bot');
    }
    this.subscribers = new Set();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.bot.command('start', async (ctx) => {
      try {
        const chatId = ctx.chat.id;
        this.subscribers.add(chatId);
        await ctx.reply(
          'Welcome to Crypto Markets Bot! You will now receive market analysis updates.'
        );
        logger.info(`New subscriber added: ${chatId}`);
      } catch (error) {
        logger.error(
          error,
          `Failed to handle start command for chat ${ctx.chat.id}:`
        );
        await ctx.reply('Failed to subscribe. Please try again later.');
      }
    });

    this.bot.command('stop', async (ctx) => {
      try {
        const chatId = ctx.chat.id;
        this.subscribers.delete(chatId);
        await ctx.reply('You have unsubscribed from market analysis updates.');
        logger.info(`Subscriber removed: ${chatId}`);
      } catch (error) {
        logger.error(
          error,
          `Failed to handle stop command for chat ${ctx.chat.id}:`
        );
        await ctx.reply('Failed to unsubscribe. Please try again later.');
      }
    });

    this.bot.catch((err, ctx) => {
      logger.error(err, 'Telegram bot error:');
      ctx
        .reply('An error occurred. Please try again later.')
        .catch((e) => logger.error(e, 'Failed to send error message:'));
    });
  }

  public async broadcastReport(report: string): Promise<void> {
    const failedDeliveries: number[] = [];

    for (const chatId of this.subscribers) {
      try {
        await this.bot.telegram.sendMessage(chatId, report);
        logger.info(`Report sent to subscriber ${chatId}`);
      } catch (error) {
        failedDeliveries.push(chatId);

        if (this.isChatNotFoundError(error)) {
          this.subscribers.delete(chatId);
          logger.info(`Removed inactive subscriber: ${chatId}`);
        } else {
          logger.error(error, `Failed to send message to chat ${chatId}:`);
        }
      }
    }

    if (failedDeliveries.length > 0) {
      throw new TelegramError(
        `Failed to deliver report to ${failedDeliveries.length} subscribers`
      );
    }
  }

  private isChatNotFoundError(error: unknown): boolean {
    // Type guard to check if error is an object
    if (!error || typeof error !== 'object') {
      return false;
    }

    // Type guard for error object structure
    interface TelegramErrorResponse {
      code: string;
      response?: {
        error_code?: number;
      };
    }

    const telegramError = error as TelegramErrorResponse;

    return (
      telegramError.code === 'ETELEGRAM' &&
      telegramError.response?.error_code === 403
    );
  }

  public async start(): Promise<void> {
    try {
      await this.bot.launch();
      logger.info('Telegram bot started successfully');
    } catch (error) {
      throw TelegramError.from(error, 'Failed to start Telegram bot');
    }
  }

  public stop(): void {
    try {
      this.bot.stop();
      logger.info('Telegram bot stopped');
    } catch (error) {
      logger.error(error, 'Error while stopping Telegram bot:');
    }
  }
}
