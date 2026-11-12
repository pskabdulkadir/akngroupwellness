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

CREATE TABLE IF NOT EXISTS application_state (
    state_key VARCHAR(64) PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    status VARCHAR(50) NOT NULL,
    release_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_voucher ON journal_entries(voucher_number);

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
