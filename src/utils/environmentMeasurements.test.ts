import assert from 'node:assert/strict';
import test from 'node:test';
import type { ScanEnvironmentMeasurements, ScanResult } from '../types';
import { getEnvironmentReadingSummary, getEnvironmentSensorCoverage, getParanormalEstimate } from './environmentMeasurements';

const measurements = (statuses: [ScanEnvironmentMeasurements['microphone']['status'], ScanEnvironmentMeasurements['ambientLight']['status'], ScanEnvironmentMeasurements['magneticField']['status']]): ScanEnvironmentMeasurements => ({
  capturedAt: 0,
  durationSeconds: 0,
  microphone: { status: statuses[0] },
  ambientLight: { status: statuses[1], unit: 'lx' },
  magneticField: { status: statuses[2] },
});

test('sensör ölçüm kapsamı yalnızca ölçüm alınan sensörleri sayar', () => {
  assert.deepEqual(getEnvironmentSensorCoverage(), { measuredSensorCount: 0, totalSensorCount: 3, percent: 0 });
  assert.equal(getEnvironmentSensorCoverage(measurements(['measured', 'not-supported', 'permission-denied'])).percent, 33);
  assert.equal(getEnvironmentSensorCoverage(measurements(['measured', 'measured', 'unavailable'])).percent, 67);
  assert.deepEqual(getEnvironmentSensorCoverage(measurements(['measured', 'measured', 'measured'])), { measuredSensorCount: 3, totalSensorCount: 3, percent: 100 });
});

test('tarama tahmini kayıtlı optik ve çevresel ölçümlerden deterministik hesaplanır', () => {
  const scan = {
    bioEnergyLevel: 50,
    opticalBrightnessPercent: 40,
    frequencyHz: 963,
    environmentMeasurements: {
      capturedAt: 1,
      durationSeconds: 15,
      microphone: { status: 'measured', relativeLevelPercent: 20, dominantFrequencyHz: 400, spectralCentroidHz: 800 },
      ambientLight: { status: 'measured', value: 100, unit: 'lx' },
      magneticField: { status: 'measured', magnitudeMicrotesla: 50 },
    },
  } as ScanResult;

  assert.deepEqual(getParanormalEstimate(scan), getParanormalEstimate(scan));
  assert.equal(getParanormalEstimate(scan).percent, 26);
  assert.match(getEnvironmentReadingSummary(scan).light, /100 lx/);
});
