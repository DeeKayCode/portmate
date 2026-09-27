import pg from "pg";

export interface Database {
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: unknown[]): Promise<pg.QueryResult<T>>;
  connect?(): Promise<pg.PoolClient>;
}

export async function transaction<T>(db: Database, work: (client: Database) => Promise<T>): Promise<T> {
  if (!db.connect) throw new Error('Transactions require a dedicated database connection');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work({ query: client.query.bind(client) });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export function createDatabase(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
}
