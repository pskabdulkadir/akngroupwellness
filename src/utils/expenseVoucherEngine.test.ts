import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVoucherWithholding,
  generateOfficialGiderPusulasiXml,
  generateBankBatchFile,
  CANONICAL_COMPANY_PROFILE,
} from '../services/expenseVoucherEngine';
import { ExpenseVoucherRecord, PendingPayoutItem } from '../types/accounting';

test('Bireysel bayilerde GVK 94/10-b uyarınca %20 stopaj doğru hesaplanır', () => {
  const gross = 10000;
  const isCompany = false;
  const result = calculateVoucherWithholding(gross, isCompany);

  assert.equal(result.withholdingRate, 0.20);
  assert.equal(result.withholdingAmount, 2000);
  assert.equal(result.netAmount, 8000);
});

test('Kurumsal mükellef şirket bayilerinde stopaj kesilmez (%0 vergi, fatura karşılığı)', () => {
  const gross = 25000;
  const isCompany = true;
  const result = calculateVoucherWithholding(gross, isCompany);

  assert.equal(result.withholdingRate, 0);
  assert.equal(result.withholdingAmount, 0);
  assert.equal(result.netAmount, 25000);
});

test('e-Gider Pusulası XML çıktısı GİB UBL-TR 2.1 standartlarına uygundur', () => {
  const voucher: ExpenseVoucherRecord = {
    id: 1,
    voucher_number: 'GDP-2026-000001',
    ettn_uuid: 'c1234567-89ab-4f21-98a1-000000000001',
    commission_log_id: 'COMM-001',
    source_event_id: 'EV-COMM-001',
    order_id: 'ORD-1001',
    dealer_user_id: 'DEALER-01',
    dealer_full_name: 'Ahmet Yılmaz',
    dealer_tckn: '12345678901',
    dealer_iban: 'TR330006100511122233344455',
    is_company: false,
    gross_amount: 5000,
    withholding_rate: 0.20,
    withholding_amount: 1000,
    net_amount: 4000,
    currency: 'TRY',
    status: 'ISSUED',
    integrator_name: 'QNB_EFINANS',
    integrator_status: 'GIB_SUBMITTED',
    created_at: '2026-10-15T14:30:00Z',
  };

  const xml = generateOfficialGiderPusulasiXml(voucher, CANONICAL_COMPANY_PROFILE);

  assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>'));
  assert.ok(xml.includes('<cbc:ID>GDP-2026-000001</cbc:ID>'));
  assert.ok(xml.includes('<cbc:UUID>c1234567-89ab-4f21-98a1-000000000001</cbc:UUID>'));
  assert.ok(xml.includes('193 Sayılı GVK Madde 94/10-b'));
  assert.ok(xml.includes('<cbc:TaxAmount currencyID="TRY">1000.00</cbc:TaxAmount>'));
  assert.ok(xml.includes('<cbc:PayableAmount currencyID="TRY">4000.00</cbc:PayableAmount>'));
  assert.ok(xml.includes('TR330006100511122233344455'));
});

test('Banka Toplu Transfer Dosyası (Garanti, Akbank, İş Bankası, Ziraat) doğru kolonlar ve UTF-8 BOM ile üretilir', () => {
  const items: PendingPayoutItem[] = [
    {
      commission_id: 'COMM-1',
      voucher_number: 'GDP-2026-000001',
      ettn_uuid: 'uuid-1',
      order_id: 'ORD-1',
      dealer_user_id: 'D-1',
      dealer_name: 'Zeynep Kaya',
      dealer_tckn: '19402948271',
      dealer_iban: 'TR330006100511122233344401',
      bank_name: 'Garanti BBVA',
      is_company: false,
      gross_amount: 10000,
      withholding_amount: 2000,
      net_amount: 8000,
      currency: 'TRY',
      release_at: '2026-10-20T00:00:00Z',
      status: 'READY_FOR_PAYOUT',
    },
    {
      commission_id: 'COMM-2',
      voucher_number: 'GDP-2026-000002',
      ettn_uuid: 'uuid-2',
      order_id: 'ORD-2',
      dealer_user_id: 'D-2',
      dealer_name: 'Alfa Ltd',
      dealer_tckn: '0540892341',
      dealer_iban: 'TR440006200123456789012302',
      bank_name: 'Garanti BBVA',
      is_company: true,
      gross_amount: 15000,
      withholding_amount: 0,
      net_amount: 15000,
      currency: 'TRY',
      release_at: '2026-10-20T00:00:00Z',
      status: 'READY_FOR_PAYOUT',
    },
  ];

  const fileGaranti = generateBankBatchFile('GARANTI', items);
  assert.ok(fileGaranti.content.startsWith('\uFEFF')); // UTF-8 BOM for Turkish Excel
  assert.ok(fileGaranti.content.includes('ALICI_ADI;HESAP_IBAN;TUTAR'));
  assert.equal(fileGaranti.totalNet, 23000);
  assert.equal(fileGaranti.count, 2);

  const fileZiraat = generateBankBatchFile('ZIRAAT', items);
  assert.ok(fileZiraat.content.startsWith('\uFEFF'));
  assert.ok(fileZiraat.content.includes('NO;ALICI_AD_SOYAD;IBAN_NO;ODEME_TUTARI'));
});
