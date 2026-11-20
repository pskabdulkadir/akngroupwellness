-- AKN GROUP WELLNESS - MONOLINE MLM & QUANTUM PLATFORM
-- PostgreSQL-18 Veritabanı Şeması (monoline veritabanı)
-- Kaynak: Neon pg_dump --schema-only uyumlu üretim şeması
-- Karakter Kümesi: UTF-8 | ACID Uyumlu Transaction & FOR UPDATE Kilitleri
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. KULLANICILAR VE DİJİTAL KİMLİK TABLOSU (users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    city VARCHAR(80) DEFAULT 'İstanbul',
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    sponsor_id VARCHAR(64),
    monoline_position BIGINT UNIQUE,
    career_level INT DEFAULT 1,
    max_career_level INT DEFAULT 1,
    active_career_level INT DEFAULT 1,
    personal_volume_30d NUMERIC(15,2) DEFAULT 0.00,
    group_volume_30d NUMERIC(15,2) DEFAULT 0.00,
    active_direct_referrals_30d INT DEFAULT 0,
    activity_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    scan_credits INT DEFAULT 0,
    has_tax_company BOOLEAN DEFAULT FALSE,
    tax_number VARCHAR(20),
    tax_office VARCHAR(100),
    company_title VARCHAR(200),
    tc_identity_no VARCHAR(20),
    assigned_leg VARCHAR(10) DEFAULT 'AUTO',
    left_leg_volume NUMERIC(15,2) DEFAULT 0.00,
    right_leg_volume NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_monoline_pos ON users(monoline_position);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS application_state (
    state_key VARCHAR(64) PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value, updated_by)
VALUES ('USD_TRY_RATE', '50.00'::jsonb, 'SYSTEM')
ON CONFLICT (setting_key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. CÜZDANLAR VE 14 GÜNLÜK KORUMALI BAKİYE (wallets)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    balance NUMERIC(15,2) DEFAULT 0.00,
    pending_balance NUMERIC(15,2) DEFAULT 0.00,
    total_withdrawn NUMERIC(15,2) DEFAULT 0.00,
    total_earned NUMERIC(15,2) DEFAULT 0.00,
    unilevel_earnings NUMERIC(15,2) DEFAULT 0.00,
    monoline_incentive_earnings NUMERIC(15,2) DEFAULT 0.00,
    direct_sponsor_earnings NUMERIC(15,2) DEFAULT 0.00,
    iban VARCHAR(50),
    iban_holder_name VARCHAR(150),
    bank_name VARCHAR(100),
    crypto_trc20 VARCHAR(100),
    wallet_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS admin_wallet_adjustments (
    id BIGSERIAL PRIMARY KEY,
    request_id UUID,
    user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
    admin_user_id VARCHAR(64) NOT NULL,
    region VARCHAR(20) NOT NULL CHECK (region IN ('DOMESTIC', 'INTERNATIONAL')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admin_wallet_adjustments ADD COLUMN IF NOT EXISTS request_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_wallet_adjustments_request_id
    ON admin_wallet_adjustments(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_wallet_adjustments_user_created
    ON admin_wallet_adjustments(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. SİSTEM VE DEVİR HAVUZU CÜZDANI (system_wallet)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_wallet (
    id INT PRIMARY KEY DEFAULT 1,
    system_pool_balance NUMERIC(15,2) DEFAULT 0.00,
    unclaimed_pool_balance NUMERIC(15,2) DEFAULT 0.00,
    career_pool_balance NUMERIC(15,2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_wallet (id, system_pool_balance, unclaimed_pool_balance, career_pool_balance)
VALUES (1, 0.00, 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. ÇİFT MOTORLU KOMİSYON İŞLEM GÜNLÜĞÜ (commission_logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    request_id VARCHAR(120),
    source_user_id VARCHAR(64) REFERENCES users(user_id),
    target_user_id VARCHAR(64) REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL,
    depth_level INT,
    amount NUMERIC(15,2) NOT NULL,
    amount_usd NUMERIC(15,2),
    region VARCHAR(20),
    status VARCHAR(50) NOT NULL,
    release_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE commission_logs ADD COLUMN IF NOT EXISTS amount_usd NUMERIC(15,2);
ALTER TABLE commission_logs ADD COLUMN IF NOT EXISTS region VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_commission_logs_target ON commission_logs(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_logs_order ON commission_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_logs_release ON commission_logs(release_at, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_commission_unique
    ON commission_logs(order_id, type, COALESCE(depth_level, 0), COALESCE(target_user_id, 'SYSTEM'));

-- ------------------------------------------------------------------------------
-- 5. SİPARİŞ HAREKETLERİ VE CAYMA TAKİBİ (orders_log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders_log (
    order_id VARCHAR(100) PRIMARY KEY,
    request_id VARCHAR(120) UNIQUE,
    user_id VARCHAR(64) REFERENCES users(user_id),
    package_id VARCHAR(50),
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'COMPLETED',
    payment_method VARCHAR(50) DEFAULT 'CREDIT_CARD',
    provider_transaction_id VARCHAR(120),
    card_last_four VARCHAR(4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders_log(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders_log(created_at);

-- ------------------------------------------------------------------------------
-- 6. BAYİ KREDİSİ VE SEANS TARAMA HAVUZU (reseller_credits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reseller_credits (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    credits_balance INT NOT NULL DEFAULT 0,
    total_allocated INT NOT NULL DEFAULT 0,
    total_consumed INT NOT NULL DEFAULT 0,
    last_deduction_request_id VARCHAR(120),
    last_scan_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- ------------------------------------------------------------------------------
-- 7. İŞLEM İDEMPOTENCY VE YİNELEME ENGELLEME TABLOSU (idempotency_keys)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_keys (
    request_id VARCHAR(120) PRIMARY KEY,
    scope VARCHAR(60) NOT NULL,
    user_id VARCHAR(64),
    response_payload JSONB,
    status VARCHAR(20) DEFAULT 'PROCESSED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_idempotency_scope_created ON idempotency_keys(scope, created_at);

-- ------------------------------------------------------------------------------
-- 8. GİDER PUSULASI VE VERGİ KESİNTİLERİ (expense_vouchers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_vouchers (
    id BIGSERIAL PRIMARY KEY,
    voucher_number VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(64) REFERENCES users(user_id),
    gross_amount NUMERIC(15,2) NOT NULL,
    withholding_tax NUMERIC(15,2) NOT NULL,
    net_payout NUMERIC(15,2) NOT NULL,
    xml_content TEXT,
    status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ------------------------------------------------------------------------------
-- 9. BANKA TRANSFER VE TOPLU ÖDEME DOSYALARI (payout_batches)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payout_batches (
    id VARCHAR(100) PRIMARY KEY,
    bank_code VARCHAR(50) NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    total_items INT NOT NULL,
    file_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'GENERATED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payout_batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ------------------------------------------------------------------------------
-- 10. ÇEKİM TALEPLERİ VE ONAYLAR (withdrawal_requests)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(120) UNIQUE,
    user_id VARCHAR(64) REFERENCES users(user_id),
    amount NUMERIC(15,2) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    iban VARCHAR(60),
    account_holder VARCHAR(150),
    bank_name VARCHAR(100),
    crypto_trc20 VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDING',
    rejection_reason TEXT,
    decided_by VARCHAR(64),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ------------------------------------------------------------------------------
-- 11. BİLDİRİM VE KUYRUK GÜNLÜĞÜ (notification_outbox)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_outbox (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id),
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 12. YEVMİYE KAYITLARI (journal_entries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGSERIAL PRIMARY KEY,
    voucher_number VARCHAR(100) NOT NULL,
    entry_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(64),
    debit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    entry_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_voucher ON journal_entries(voucher_number);

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

ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS voucher_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE payout_batches ADD COLUMN IF NOT EXISTS batch_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS withdrawal_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS payout_batch_items (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(100) NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
    voucher_id VARCHAR(100) NOT NULL,
    commission_id VARCHAR(100) NOT NULL,
    dealer_user_id VARCHAR(64) NOT NULL,
    dealer_name VARCHAR(150) NOT NULL,
    iban VARCHAR(60) NOT NULL,
    gross_amount NUMERIC(15,2) NOT NULL,
    withholding_amount NUMERIC(15,2) NOT NULL,
    net_amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    wallet_tx_id VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    item_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (batch_id, voucher_id)
);

ALTER TABLE payout_batch_items ADD COLUMN IF NOT EXISTS item_data JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawal_requests_request_id ON withdrawal_requests(request_id);

-- ------------------------------------------------------------------------------
-- 13. OTOMATİK ZAMAN DAMGASI GÜNCELLEME TRİGGER'I
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON wallets;
CREATE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_reseller_credits_updated_at ON reseller_credits;
CREATE TRIGGER trg_reseller_credits_updated_at
BEFORE UPDATE ON reseller_credits
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER trg_journal_entries_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_withdrawal_requests_updated_at ON withdrawal_requests;
CREATE TRIGGER trg_withdrawal_requests_updated_at
BEFORE UPDATE ON withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_expense_vouchers_updated_at ON expense_vouchers;
CREATE TRIGGER trg_expense_vouchers_updated_at
BEFORE UPDATE ON expense_vouchers
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_payout_batches_updated_at ON payout_batches;
CREATE TRIGGER trg_payout_batches_updated_at
BEFORE UPDATE ON payout_batches
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'orders_log'::regclass AND conname = 'orders_log_user_id_fkey' AND confdeltype <> 'n') THEN
        ALTER TABLE orders_log DROP CONSTRAINT orders_log_user_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'orders_log'::regclass AND conname = 'orders_log_user_id_fkey') THEN
        ALTER TABLE orders_log ADD CONSTRAINT orders_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'commission_logs'::regclass AND conname = 'commission_logs_source_user_id_fkey' AND confdeltype <> 'n') THEN
        ALTER TABLE commission_logs DROP CONSTRAINT commission_logs_source_user_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'commission_logs'::regclass AND conname = 'commission_logs_source_user_id_fkey') THEN
        ALTER TABLE commission_logs ADD CONSTRAINT commission_logs_source_user_id_fkey FOREIGN KEY (source_user_id) REFERENCES users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'commission_logs'::regclass AND conname = 'commission_logs_target_user_id_fkey' AND confdeltype <> 'n') THEN
        ALTER TABLE commission_logs DROP CONSTRAINT commission_logs_target_user_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'commission_logs'::regclass AND conname = 'commission_logs_target_user_id_fkey') THEN
        ALTER TABLE commission_logs ADD CONSTRAINT commission_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'expense_vouchers'::regclass AND conname = 'expense_vouchers_user_id_fkey' AND confdeltype <> 'n') THEN
        ALTER TABLE expense_vouchers DROP CONSTRAINT expense_vouchers_user_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'expense_vouchers'::regclass AND conname = 'expense_vouchers_user_id_fkey') THEN
        ALTER TABLE expense_vouchers ADD CONSTRAINT expense_vouchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'withdrawal_requests'::regclass AND conname = 'withdrawal_requests_user_id_fkey' AND confdeltype <> 'n') THEN
        ALTER TABLE withdrawal_requests DROP CONSTRAINT withdrawal_requests_user_id_fkey;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'withdrawal_requests'::regclass AND conname = 'withdrawal_requests_user_id_fkey') THEN
        ALTER TABLE withdrawal_requests ADD CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'journal_entries'::regclass AND conname = 'journal_entries_user_id_fkey') THEN
        ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
    END IF;
END;
$$;
