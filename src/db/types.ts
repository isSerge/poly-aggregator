import { Database, Statement } from 'better-sqlite3';
import { z } from 'zod';

interface SqliteParams {
  [key: string]: string | number | null | boolean;
}

export class TypedStatement<
  TParams extends SqliteParams,
  TResult extends object | unknown[],
> {
  private readonly stmt: Statement;
  private readonly schema: z.ZodType<TResult>;

  constructor(stmt: Statement, schema: z.ZodType<TResult>) {
    this.stmt = stmt;
    this.schema = schema;
  }

  run(params: TParams): void {
    this.stmt.run(params);
  }

  get(params: TParams): TResult | undefined {
    const result = this.stmt.get(params);
    if (!result) return undefined;
    return this.schema.parse(result);
  }

  all(params: TParams): TResult[] {
    const results = this.stmt.all(params);
    return results.map((result) => this.schema.parse(result));
  }
}

export function prepareTyped<
  TParams extends SqliteParams,
  TResult extends object | unknown[],
>(
  db: Database,
  sql: string,
  schema: z.ZodType<TResult>
): TypedStatement<TParams, TResult> {
  return new TypedStatement(db.prepare(sql), schema);
}

export type InsertResult = { lastInsertRowid: number } | { changes: number };
