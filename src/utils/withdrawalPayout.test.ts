import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidTrIban } from './withdrawalPayout';

test('geçerli TR IBAN checksum ile kabul edilir', () => {
  assert.equal(isValidTrIban('TR33 0006 1005 1978 6457 8413 26'), true);
});

test('checksum hatalı TR IBAN reddedilir', () => {
  assert.equal(isValidTrIban('TR34 0006 1005 1978 6457 8413 26'), false);
});

test('TR IBAN uzunluğu hatalıysa reddedilir', () => {
  assert.equal(isValidTrIban('TR3300061005197864578413260'), false);
});
