/**
 * Local PostgreSQL-18 Database Connection Layer & ACID Transaction Engine
 * AKN Global Group Ltd. - Monoline MLM Platform
 *
 * Fully supports:
 * - Localhost PostgreSQL-18 (monoline veritabanı)
 * - Connection pooling via 'pg'
 * - Row-level locking ('SELECT ... FOR UPDATE') for financial & credit operations
 * - ACID Transactions ('withTransaction')
 * - Idempotency tracking ('request_id')
 * - PostgreSQL is required; unavailable database operations fail closed
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'monoline'}`;

const isProduction = process.env.NODE_ENV === 'production';
const isRemotePg =
  process.env.DATABASE_SSL === 'true' ||
  (process.env.DATABASE_SSL !== 'false' &&
    (isProduction ||
      DATABASE_URL.includes('render.com') ||
      DATABASE_URL.includes('dpg-') ||
      DATABASE_URL.includes('sslmode=require')));

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isRemotePg ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let isPostgresAvailable = false;
export function getIsPostgresAvailable(): boolean {
  return isPostgresAvailable;
}

/**
 * Initializes the required PostgreSQL schema before the API starts.
 * Applies monoline_schema.sql automatically on first connect.
 */
export async function initPostgresDatabase(): Promise<boolean> {
  const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  let client: PoolClient | undefined;
  let lastError: any;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let candidate: PoolClient | undefined;
    try {
      candidate = await pool.connect();
      const res = await candidate.query('SELECT 1 as connected');
      if (res.rows[0]?.connected !== 1) throw new Error('PostgreSQL hazır yanıt vermedi.');
      client = candidate;
      break;
    } catch (err) {
      lastError = err;
      candidate?.release();
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  if (!client) {
    isPostgresAvailable = false;
    console.error(
      `[PostgreSQL-18] Veritabanına (${maskedUrl}) 3 denemede bağlanılamadı (${lastError?.code || lastError?.message}). PostgreSQL zorunlu modda uygulama başlatılmayacak.`
    );
    return false;
  }

  try {
    console.log(`[PostgreSQL-18] PostgreSQL veritabanına (${maskedUrl}) başarıyla bağlanıldı. SSL: ${isRemotePg ? 'Aktif' : 'Pasif'}`);
    const schemaPath = path.resolve(process.cwd(), 'monoline_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('[PostgreSQL-18] monoline_schema.sql üretim tabloları ve indeksleri başarıyla doğrulandı.');
    }
    isPostgresAvailable = true;
    return true;
  } catch (err: any) {
    isPostgresAvailable = false;
    console.error(
      `[PostgreSQL-18] Şema başlatılamadı (${err.code || err.message}). PostgreSQL zorunlu modda uygulama başlatılmayacak.`
    );
    return false;
  } finally {
    client.release();
  }
}

/**
 * Safe query wrapper with error handling
 */
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T> | null> {
  if (!isPostgresAvailable) {
    throw new Error('PostgreSQL bağlantısı yok; veritabanı sorgusu gerçekleştirilemedi.');
  }
  try {
    return await pool.query<T>(text, params);
  } catch (err) {
    console.error('[PostgreSQL Query Error]:', err);
    throw err;
  }
}

/**
 * Execute an ACID-compliant transaction with automatic rollback on error.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!isPostgresAvailable) {
    throw new Error('PostgreSQL bağlantısı yok; kalıcı veri gerektiren işlem reddedildi.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL Transaction Rolled Back]:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Bayi Kredisi Atomik Düşüm Fonksiyonu (ACID + FOR UPDATE + Idempotency)
 */
export async function deductResellerCreditsAtomic(
  userId: string,
  amount: number,
  requestId: string
): Promise<{
  success: boolean;
  remainingCredits: number;
  message: string;
  isIdempotentReplay?: boolean;
}> {
  if (!userId || amount <= 0) {
    return { success: false, remainingCredits: 0, message: 'Geçersiz parametreler.' };
  }

  if (isPostgresAvailable) {
    return await withTransaction(async (client) => {
      // 1. Idempotency Check
      if (requestId) {
        const idempCheck = await client.query(
          'SELECT response_payload FROM idempotency_keys WHERE request_id = $1',
          [requestId]
        );
        if (idempCheck.rows.length > 0) {
          const payload = idempCheck.rows[0].response_payload;
          return {
            success: true,
            remainingCredits: payload.remainingCredits,
            message: 'İşlem daha önce gerçekleştirilmiş (Idempotent replay).',
            isIdempotentReplay: true,
          };
        }
      }

      // 2. Row-level Lock (FOR UPDATE)
      const creditRes = await client.query(
        'SELECT credits_balance FROM reseller_credits WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      let currentBalance = 0;
      if (creditRes.rows.length === 0) {
        // Initialize reseller credits record if missing
        await client.query(
          'INSERT INTO reseller_credits (user_id, credits_balance) VALUES ($1, 0) ON CONFLICT DO NOTHING',
          [userId]
        );
        currentBalance = 0;
      } else {
        currentBalance = creditRes.rows[0].credits_balance;
      }

      if (currentBalance < amount) {
        return {
          success: false,
          remainingCredits: currentBalance,
          message: `Yetersiz seans kredisi. Mevcut: ${currentBalance}, İstenen: ${amount}`,
        };
      }

      // 3. Atomically Deduct Credits
      const updatedBalance = currentBalance - amount;
      await client.query(
        `UPDATE reseller_credits 
         SET credits_balance = $1, 
             total_consumed = total_consumed + $2,
             last_deduction_request_id = $3,
             last_scan_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        [updatedBalance, amount, requestId || null, userId]
      );

      // 4. Record Idempotency Key
      if (requestId) {
        await client.query(
          `INSERT INTO idempotency_keys (request_id, scope, user_id, response_payload)
           VALUES ($1, 'CREDIT_DEDUCT', $2, $3)
           ON CONFLICT (request_id) DO NOTHING`,
          [requestId, userId, JSON.stringify({ remainingCredits: updatedBalance })]
        );
      }

      return {
        success: true,
        remainingCredits: updatedBalance,
        message: 'Kredi başarıyla düşüldü.',
      };
    });
  }

  throw new Error('PostgreSQL bağlantısı yok; kredi işlemi gerçekleştirilemedi.');
}

export async function readApplicationState(): Promise<unknown | null> {
  if (!isPostgresAvailable) {
    throw new Error('PostgreSQL bağlantısı yok; kalıcı uygulama durumu okunamadı.');
  }
  const result = await pool.query('SELECT payload FROM application_state WHERE state_key = $1', ['main']);
  return result.rows[0]?.payload ?? null;
}
