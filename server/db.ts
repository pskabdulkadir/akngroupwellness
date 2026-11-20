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
    (isProduction || DATABASE_URL.includes('sslmode=require')));

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isRemotePg ? { rejectUnauthorized: false } : false,
  max: process.env.VERCEL ? 2 : Number(process.env.PGPOOL_MAX || 10),
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
export async function initPostgresDatabase(options: { applySchema?: boolean } = {}): Promise<boolean> {
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
    const shouldApplySchema = options.applySchema ?? !process.env.VERCEL;
    const schemaPath = path.resolve(process.cwd(), 'monoline_schema.sql');
    if (shouldApplySchema && fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('[PostgreSQL-18] monoline_schema.sql tabloları ve indeksleri doğrulandı.');
    }
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounting_events (
        source_event_id VARCHAR(120) PRIMARY KEY,
        event_type VARCHAR(60) NOT NULL,
        accounting_status VARCHAR(40) NOT NULL DEFAULT 'NEEDS_REVIEW',
        tax_status VARCHAR(40) NOT NULL DEFAULT 'NEEDS_REVIEW',
        invoice_status VARCHAR(40) NOT NULL DEFAULT 'DRAFT_REQUIRED',
        amount NUMERIC(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        event_data JSONB NOT NULL DEFAULT '{}'::jsonb
      );
      CREATE INDEX IF NOT EXISTS idx_accounting_events_created_at ON accounting_events(created_at DESC);
      CREATE TABLE IF NOT EXISTS accounting_bank_accounts (
        account_id VARCHAR(64) PRIMARY KEY,
        bank_name VARCHAR(200) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        iban_masked VARCHAR(64) NOT NULL DEFAULT '',
        balance NUMERIC(15,2),
        last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL,
        open_banking_status VARCHAR(20) NOT NULL DEFAULT 'IMPORTED'
      );
      CREATE TABLE IF NOT EXISTS accounting_bank_transactions (
        transaction_id VARCHAR(64) PRIMARY KEY,
        account_id VARCHAR(64) NOT NULL REFERENCES accounting_bank_accounts(account_id),
        transaction_date DATE NOT NULL,
        currency VARCHAR(10) NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        transaction_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_accounting_bank_transactions_date ON accounting_bank_transactions(transaction_date DESC);
      CREATE INDEX IF NOT EXISTS idx_accounting_bank_transactions_account ON accounting_bank_transactions(account_id, transaction_date DESC);
      CREATE TABLE IF NOT EXISTS credit_ledger (
        id BIGSERIAL PRIMARY KEY,
        request_id VARCHAR(120) NOT NULL UNIQUE,
        user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        entry_type VARCHAR(50) NOT NULL,
        delta INT NOT NULL,
        previous_balance INT NOT NULL,
        new_balance INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created ON credit_ledger(user_id, created_at DESC);
    `);
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
  code?: 'INSUFFICIENT_CREDITS';
  isIdempotentReplay?: boolean;
}> {
  if (!userId || !Number.isInteger(amount) || amount <= 0 || !requestId) {
    return { success: false, remainingCredits: 0, message: 'Geçersiz parametreler.' };
  }

  if (isPostgresAvailable) {
    return await withTransaction(async (client) => {
      // Lock first so concurrent requests with the same requestId serialize before the idempotency check.
      const memberRes = await client.query(
        'SELECT scan_credits FROM users WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      if (memberRes.rows.length === 0) {
        return { success: false, remainingCredits: 0, message: 'Bayi kredi hesabı bulunamadı.' };
      }

      const idempCheck = await client.query(
        `SELECT response_payload FROM idempotency_keys
         WHERE request_id = $1 AND scope = 'CREDIT_DEDUCT' AND user_id = $2`,
        [requestId, userId]
      );
      if (idempCheck.rows.length > 0) {
        return {
          success: true,
          remainingCredits: Number(idempCheck.rows[0].response_payload.remainingCredits),
          message: 'İşlem daha önce gerçekleştirilmiş (Idempotent replay).',
          isIdempotentReplay: true,
        };
      }

      const currentBalance = Number(memberRes.rows[0].scan_credits) || 0;
      if (currentBalance < amount) {
        return {
          success: false,
          remainingCredits: currentBalance,
          code: 'INSUFFICIENT_CREDITS',
          message: `Yetersiz seans kredisi. Mevcut: ${currentBalance}, İstenen: ${amount}`,
        };
      }

      // 3. Atomically deduct and mirror the balance into the scan accounting table.
      const updatedBalance = currentBalance - amount;
      await client.query(
        'UPDATE users SET scan_credits = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [updatedBalance, userId]
      );
      await client.query(
        `INSERT INTO reseller_credits (user_id, credits_balance, total_consumed, last_deduction_request_id, last_scan_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           credits_balance = EXCLUDED.credits_balance,
           total_consumed = reseller_credits.total_consumed + EXCLUDED.total_consumed,
           last_deduction_request_id = EXCLUDED.last_deduction_request_id,
           last_scan_at = EXCLUDED.last_scan_at,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, updatedBalance, amount, requestId || null]
      );

      await client.query(
        `INSERT INTO idempotency_keys (request_id, scope, user_id, response_payload)
         VALUES ($1, 'CREDIT_DEDUCT', $2, $3)`,
        [requestId, userId, JSON.stringify({ remainingCredits: updatedBalance, amount })]
      );
      await client.query(
        `INSERT INTO credit_ledger (request_id, user_id, entry_type, delta, previous_balance, new_balance)
         VALUES ($1, $2, 'CREDIT_DEDUCT', $3, $4, $5)`,
        [requestId, userId, -amount, currentBalance, updatedBalance]
      );

      return {
        success: true,
        remainingCredits: updatedBalance,
        message: 'Kredi başarıyla düşüldü.',
      };
    });
  }

  throw new Error('PostgreSQL bağlantısı yok; kredi işlemi gerçekleştirilemedi.');
}

/**
 * Refunds exactly the amount recorded by the original CREDIT_DEDUCT request; the caller cannot choose the amount.
 */
export async function refundResellerCreditsAtomic(
  userId: string,
  requestId: string
): Promise<{
  success: boolean;
  remainingCredits: number;
  message: string;
  isIdempotentReplay?: boolean;
}> {
  if (!userId || !requestId) {
    return { success: false, remainingCredits: 0, message: 'Geçersiz parametreler.' };
  }

  if (isPostgresAvailable) {
    return await withTransaction(async (client) => {
      const memberRes = await client.query(
        'SELECT scan_credits FROM users WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      if (memberRes.rows.length === 0) {
        return { success: false, remainingCredits: 0, message: 'Bayi kredi hesabı bulunamadı.' };
      }

      const refundKey = `REFUND:${requestId}`;
      const refundCheck = await client.query(
        'SELECT scope, user_id, response_payload FROM idempotency_keys WHERE request_id = $1',
        [refundKey]
      );
      if (refundCheck.rows.length > 0) {
        if (refundCheck.rows[0].scope !== 'CREDIT_REFUND' || refundCheck.rows[0].user_id !== userId) {
          return { success: false, remainingCredits: 0, message: 'İade anahtarı başka bir kredi hareketi için kullanılmış.' };
        }
        return {
          success: true,
          remainingCredits: Number(refundCheck.rows[0].response_payload.remainingCredits),
          message: 'İade daha önce gerçekleştirilmiş (Idempotent replay).',
          isIdempotentReplay: true,
        };
      }

      const deductRes = await client.query(
        `SELECT response_payload FROM idempotency_keys
         WHERE request_id = $1 AND scope = 'CREDIT_DEDUCT' AND user_id = $2`,
        [requestId, userId]
      );
      if (deductRes.rows.length === 0) {
        return { success: false, remainingCredits: 0, message: 'Düşüm kaydı bulunamadı; iade yapılmadı.' };
      }
      const amount = Number(deductRes.rows[0].response_payload?.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        return { success: false, remainingCredits: 0, message: 'Düşüm tutarı kaydı eksik; iade yapılmadı.' };
      }

      const updatedBalance = (Number(memberRes.rows[0].scan_credits) || 0) + amount;
      await client.query(
        'UPDATE users SET scan_credits = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [updatedBalance, userId]
      );
      await client.query(
        `INSERT INTO reseller_credits (user_id, credits_balance, total_consumed)
         VALUES ($1, $2, 0)
         ON CONFLICT (user_id) DO UPDATE SET
           credits_balance = EXCLUDED.credits_balance,
           total_consumed = GREATEST(reseller_credits.total_consumed - $3, 0),
           updated_at = CURRENT_TIMESTAMP`,
        [userId, updatedBalance, amount]
      );
      await client.query(
        `INSERT INTO idempotency_keys (request_id, scope, user_id, response_payload)
         VALUES ($1, 'CREDIT_REFUND', $2, $3)`,
        [refundKey, userId, JSON.stringify({ remainingCredits: updatedBalance, amount })]
      );
      await client.query(
        `INSERT INTO credit_ledger (request_id, user_id, entry_type, delta, previous_balance, new_balance)
         VALUES ($1, $2, 'CREDIT_REFUND', $3, $4, $5)`,
        [refundKey, userId, amount, Number(memberRes.rows[0].scan_credits) || 0, updatedBalance]
      );

      return {
        success: true,
        remainingCredits: updatedBalance,
        message: 'Kredi iade edildi.',
      };
    });
  }

  throw new Error('PostgreSQL bağlantısı yok; kredi iadesi gerçekleştirilemedi.');
}

/**
 * Admin credit change (delta or exact balance) applied under the member row lock.
 */
export interface ResellerCreditAdjustmentResult {
  success: boolean;
  previousBalance: number;
  remainingCredits: number;
  message: string;
  isIdempotentReplay?: boolean;
}

export async function adjustResellerCreditsAtomic(
  userId: string,
  change: { delta: number } | { exact: number },
  requestId: string
): Promise<ResellerCreditAdjustmentResult> {
  if (!userId || !requestId) {
    return { success: false, previousBalance: 0, remainingCredits: 0, message: 'Geçersiz parametreler.' };
  }

  if (isPostgresAvailable) {
    return await withTransaction((client) => applyResellerCreditAdjustment(client, userId, change, requestId));
  }

  throw new Error('PostgreSQL bağlantısı yok; kredi güncellemesi gerçekleştirilemedi.');
}

/**
 * Runs an admin credit change inside the caller's transaction; the member row lock and ADJUST idempotency key keep retries safe.
 */
export async function applyResellerCreditAdjustment(
  client: PoolClient,
  userId: string,
  change: { delta: number } | { exact: number },
  requestId: string
): Promise<ResellerCreditAdjustmentResult> {
  const memberRes = await client.query(
    'SELECT scan_credits FROM users WHERE user_id = $1 FOR UPDATE',
    [userId]
  );
  if (memberRes.rows.length === 0) {
    return { success: false, previousBalance: 0, remainingCredits: 0, message: 'Bayi kredi hesabı bulunamadı.' };
  }

  const adjustKey = `ADJUST:${requestId}`;
  const adjustCheck = await client.query(
    'SELECT scope, user_id, response_payload FROM idempotency_keys WHERE request_id = $1',
    [adjustKey]
  );
  if (adjustCheck.rows.length > 0) {
    if (adjustCheck.rows[0].scope !== 'CREDIT_ADJUST' || adjustCheck.rows[0].user_id !== userId) {
      return { success: false, previousBalance: 0, remainingCredits: 0, message: 'İşlem anahtarı başka bir kredi hareketi için kullanılmış.' };
    }
    const payload = adjustCheck.rows[0].response_payload;
    return {
      success: true,
      previousBalance: Number(payload.previousBalance),
      remainingCredits: Number(payload.remainingCredits),
      message: 'Kredi güncellemesi daha önce uygulanmış (Idempotent replay).',
      isIdempotentReplay: true,
    };
  }

  const previousBalance = Number(memberRes.rows[0].scan_credits) || 0;
  const nextBalance = 'exact' in change ? change.exact : previousBalance + change.delta;
  if (!Number.isInteger(nextBalance) || nextBalance < 0) {
    return {
      success: false,
      previousBalance,
      remainingCredits: previousBalance,
      message: 'Kredi bakiyesi negatif veya geçersiz olamaz.',
    };
  }

  await client.query(
    'UPDATE users SET scan_credits = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [nextBalance, userId]
  );
  await client.query(
    `INSERT INTO reseller_credits (user_id, credits_balance, total_allocated, total_consumed)
     VALUES ($1, $2, GREATEST($3, 0), 0)
     ON CONFLICT (user_id) DO UPDATE SET
       credits_balance = EXCLUDED.credits_balance,
       total_allocated = reseller_credits.total_allocated + GREATEST($3, 0),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, nextBalance, nextBalance - previousBalance]
  );
  await client.query(
    `INSERT INTO idempotency_keys (request_id, scope, user_id, response_payload)
     VALUES ($1, 'CREDIT_ADJUST', $2, $3)`,
    [adjustKey, userId, JSON.stringify({ previousBalance, remainingCredits: nextBalance })]
  );
  await client.query(
    `INSERT INTO credit_ledger (request_id, user_id, entry_type, delta, previous_balance, new_balance)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [adjustKey, userId, requestId.split(':', 1)[0] || 'CREDIT_ADJUST', nextBalance - previousBalance, previousBalance, nextBalance]
  );

  return {
    success: true,
    previousBalance,
    remainingCredits: nextBalance,
    message: 'Kredi bakiyesi güncellendi.',
  };
}

export async function readApplicationState(): Promise<unknown | null> {
  if (!isPostgresAvailable) {
    throw new Error('PostgreSQL bağlantısı yok; kalıcı uygulama durumu okunamadı.');
  }
  const result = await pool.query('SELECT payload FROM application_state WHERE state_key = $1', ['main']);
  return result.rows[0]?.payload ?? null;
}
