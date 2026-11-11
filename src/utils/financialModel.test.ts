import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FREKANS_PACKAGES,
  INITIAL_CAREER_TIERS,
  MonolineMember,
  RANK_UP_REWARDS_BY_CAREER,
  evaluateMemberOrganizationMetrics,
} from '../types/monoline';
import { getPackagePriceForRegion, resolveMemberRegion } from './walletRegion';

const EXPECTED_PACKAGE_PRICES = [101, 201, 302, 402, 503, 603, 1005, 1206, 1407, 1608, 1809, 2010, 4021, 6031];
const now = new Date().toISOString();
const future = new Date(Date.now() + 30 * 86400000).toISOString();

function createMember(
  id: number,
  sponsorId: string | null,
  careerLevel: number,
  personalVolume: number,
): MonolineMember {
  const tier = INITIAL_CAREER_TIERS[careerLevel - 1];
  return {
    id,
    user_id: `TEST-${id}`,
    global_line_id: id,
    ref_code: `REF-${id}`,
    full_name: `Test Bayi ${id}`,
    email: `test-${id}@example.test`,
    phone: '',
    city: 'İstanbul',
    joined_at: now,
    sponsor_id: sponsorId,
    sponsor_db_id: sponsorId ? 1 : null,
    highest_package_id: 'PKG_MINI_DENEME',
    session_credits: 32,
    personal_volume: personalVolume,
    group_volume: 0,
    active_direct_referrals: 0,
    career_level: careerLevel,
    career_title: tier.title,
    max_career_level: careerLevel,
    max_career_title: tier.title,
    active_career_level: careerLevel,
    active_career_title: tier.title,
    manual_career_override: null,
    unlocked_depth: tier.unlockedDepth,
    wallets: {
      sponsor_wallet: 0,
      monoline_wallet: 0,
      career_pool_wallet: 0,
      total_earnings: 0,
      system_fund_balance: 0,
      total_withdrawn: 0,
    },
    bank_details: {
      iban_holder_name: `Test Bayi ${id}`,
      bank_name: '',
      iban: '',
      trc20_address: '',
      preferred_method: 'IBAN',
    },
    two_factor: {
      enabled: false,
      secret_key: '',
      verified_at: null,
      backup_codes: [],
    },
    is_active: true,
    is_locked: false,
    activity_expires_at: future,
  };
}

test('14 paket katalogda doğru fiyat ve seans kredileriyle tanımlı', () => {
  assert.equal(FREKANS_PACKAGES.length, 14);
  assert.deepEqual(FREKANS_PACKAGES.map((pkg) => pkg.defaultPrice), EXPECTED_PACKAGE_PRICES);
  assert.equal(FREKANS_PACKAGES[0].sessionCredits, 32);
  assert.equal(FREKANS_PACKAGES.at(-1)?.id, 'PKG_ENTERPRISE_MEGA');
  assert.equal(FREKANS_PACKAGES.at(-1)?.defaultPrice, 6031);
  assert.equal(FREKANS_PACKAGES.at(-1)?.sessionCredits, 5000);
});

test('yurt dışı fiyatı 3x olur, seans hakları paket tanımındaki sayıda kalır', () => {
  assert.equal(resolveMemberRegion(' tr '), 'DOMESTIC');
  assert.equal(resolveMemberRegion('US'), 'INTERNATIONAL');
  assert.equal(resolveMemberRegion(undefined), 'DOMESTIC');

  for (const pkg of FREKANS_PACKAGES) {
    assert.equal(getPackagePriceForRegion(pkg.defaultPrice, 'DOMESTIC'), pkg.defaultPrice);
    const internationalPrice = getPackagePriceForRegion(pkg.defaultPrice, 'INTERNATIONAL');
    assert.equal(internationalPrice, pkg.defaultPrice * 3);
    const internationalUnitPrice = internationalPrice / pkg.sessionCredits;
    const expectedInternationalUnitPrice = (pkg.defaultPrice / pkg.sessionCredits) * 3;
    assert.ok(Math.abs(internationalUnitPrice - expectedInternationalUnitPrice) < 1e-10);
    assert.equal(pkg.sessionCredits, FREKANS_PACKAGES.find((candidate) => candidate.id === pkg.id)?.sessionCredits);
  }
});

test('kariyer ödülleri 2–7. seviyelerde tekil tutarlara sahip', () => {
  assert.deepEqual(
    Object.entries(RANK_UP_REWARDS_BY_CAREER).map(([level, reward]) => [Number(level), reward.cash_value]),
    [[2, 1500], [3, 4000], [4, 10000], [5, 25000], [6, 50000], [7, 125000]],
  );
});

test('dengeli organizasyon tüm kariyer koşullarını ve 7. seviyeyi karşılar', () => {
  const leader = createMember(1, null, 1, 50000);
  leader.highest_package_id = 'PKG_PLATIN_KLINIK';
  leader.group_volume = 1_000_000;
  leader.group_volume_30d = 1_000_000;
  const team = [leader];

  for (let id = 2; id <= 1001; id += 1) {
    const careerLevel = id <= 3 ? 5 : id <= 5 ? 4 : 1;
    const member = createMember(id, leader.user_id, careerLevel, 1000);
    member.group_volume_30d = 0;
    team.push(member);
  }

  const result = evaluateMemberOrganizationMetrics(leader, team);

  assert.equal(result.activeDirectsCount, 1000);
  assert.equal(result.effectiveGroupVolume, 1_000_000);
  assert.equal(result.target_active_level, 7);
  assert.equal(result.tierChecks.at(-1)?.allStrictCriteriaMet, true);
  assert.deepEqual(result.sub_career_counts, { 2: 4, 3: 4, 4: 4, 5: 2 });
});
