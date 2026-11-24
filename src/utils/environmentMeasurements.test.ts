import assert from 'node:assert/strict';
import test from 'node:test';
import type { ScanEnvironmentMeasurements } from '../types';
import { getEnvironmentSensorCoverage } from './environmentMeasurements';

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
