import { Database } from 'better-sqlite3';
import { DatabaseManager } from '../db/db.js';
import { prepareTyped, TypedStatement } from '../db/types.js';
import { z } from 'zod';
import { logger } from '../logger.js';
import { DatabaseError } from '../errors.js';

const SubscriberSchema = z.object({
  chat_id: z.number(),
  subscribed_at: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for subscribed_at',
  }),
});

type SubscriberRow = z.infer<typeof SubscriberSchema>;

export class SubscriberRepository {
  private readonly db: Database;
  private readonly insertSubscriber: TypedStatement<
    { chat_id: number },
    { lastInsertRowid: number; changes: number }
  >;
  private readonly deleteSubscriber: TypedStatement<
    { chat_id: number },
    { changes: number }
  >;
  private readonly selectSubscribers: TypedStatement<
    Record<string, never>,
    SubscriberRow
  >;

  constructor(databaseManager: DatabaseManager) {
    this.db = databaseManager.getConnection();

    this.insertSubscriber = prepareTyped(
      this.db,
      `INSERT OR IGNORE INTO subscribers (chat_id) VALUES (@chat_id)`,
      z.object({ lastInsertRowid: z.number(), changes: z.number() })
    );

    this.deleteSubscriber = prepareTyped(
      this.db,
      `DELETE FROM subscribers WHERE chat_id = @chat_id`,
      z.object({ changes: z.number() })
    );

    // Correctly validate individual rows, not arrays
    this.selectSubscribers = prepareTyped(
      this.db,
      `SELECT chat_id, subscribed_at FROM subscribers`,
      SubscriberSchema
    );
  }

  addSubscriber(chatId: number): void {
    try {
      this.insertSubscriber.run({ chat_id: chatId });
      logger.info(`Subscriber added: ${chatId}`);
    } catch (error) {
      throw DatabaseError.from(error, `Failed to add subscriber ${chatId}`);
    }
  }

  removeSubscriber(chatId: number): void {
    try {
      this.deleteSubscriber.run({ chat_id: chatId });
      logger.info(`Subscriber removed: ${chatId}`);
    } catch (error) {
      throw DatabaseError.from(error, `Failed to remove subscriber ${chatId}`);
    }
  }

  getSubscribers(): number[] {
    try {
      const rows = this.selectSubscribers.all({});
      return rows.map((row) => {
        const validatedRow = SubscriberSchema.parse(row); // Validate each row
        return validatedRow.chat_id;
      });
    } catch (error) {
      throw DatabaseError.from(error, 'Failed to fetch subscribers');
    }
  }
}
