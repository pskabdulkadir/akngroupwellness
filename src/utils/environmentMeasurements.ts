import type { EnvironmentalReadingStatus, ScanEnvironmentMeasurements } from '../types';

export interface EnvironmentMeasurementSession {
  finish: () => ScanEnvironmentMeasurements;
  cancel: () => void;
}

export function getEnvironmentSensorCoverage(measurements?: ScanEnvironmentMeasurements) {
  const statuses = [
    measurements?.microphone.status,
    measurements?.ambientLight.status,
    measurements?.magneticField.status,
  ];
  const measuredSensorCount = statuses.filter((status) => status === 'measured').length;

  return {
    measuredSensorCount,
    totalSensorCount: statuses.length,
    percent: Math.round((measuredSensorCount / statuses.length) * 100),
  };
}

const classifyError = (error: unknown): EnvironmentalReadingStatus => {
  const name = (error as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'permission-denied';
  }
  return 'unavailable';
};

export function startEnvironmentMeasurement(): EnvironmentMeasurementSession {
  let finalized = false;
  let animationFrameId: number | null = null;
  let audioContext: AudioContext | null = null;
  let microphoneStream: MediaStream | null = null;
  let microphoneStatus: EnvironmentalReadingStatus = 'permission-pending';
  let sampleCount = 0;
  let rmsTotal = 0;
  let peakFrequencyTotal = 0;
  let centroidTotal = 0;

  let ambientLightStatus: EnvironmentalReadingStatus = 'not-supported';
  let ambientLightTotal = 0;
  let ambientLightReadings = 0;
  let ambientLightSensor: any = null;

  let magneticFieldStatus: EnvironmentalReadingStatus = 'not-supported';
  let magneticXTotal = 0;
  let magneticYTotal = 0;
  let magneticZTotal = 0;
  let magneticReadings = 0;
  let magnetometer: any = null;

  const startedAt = Date.now();

  const stopMicrophone = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    microphoneStream?.getTracks().forEach((track) => track.stop());
    microphoneStream = null;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close();
    }
    audioContext = null;
  };

  const stopSensor = (sensor: any) => {
    if (!sensor) return;
    sensor.onreading = null;
    sensor.onerror = null;
    sensor.stop();
  };

  const mediaDevices = navigator.mediaDevices;
  const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
  if (!mediaDevices?.getUserMedia || !AudioContextConstructor) {
    microphoneStatus = 'not-supported';
  } else {
    try {
      audioContext = new AudioContextConstructor();
      void mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      }).then(async (stream) => {
        if (finalized) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        microphoneStream = stream;
        if (audioContext!.state === 'suspended') await audioContext!.resume();
        if (audioContext!.state !== 'running') {
          microphoneStatus = 'unavailable';
          stopMicrophone();
          return;
        }
        const analyser = audioContext!.createAnalyser();
        analyser.fftSize = 2048;
        audioContext!.createMediaStreamSource(stream).connect(analyser);
        const timeData = new Float32Array(analyser.fftSize);
        const frequencyData = new Float32Array(analyser.frequencyBinCount);

        const sample = () => {
          if (finalized || !audioContext) return;
          analyser.getFloatTimeDomainData(timeData);
          analyser.getFloatFrequencyData(frequencyData);
          let sumSquares = 0;
          let weightedMagnitude = 0;
          let magnitudeTotal = 0;
          let peakMagnitude = -Infinity;
          let peakIndex = 0;
          for (let index = 0; index < timeData.length; index++) {
            sumSquares += timeData[index] * timeData[index];
          }
          for (let index = 0; index < frequencyData.length; index++) {
            const db = frequencyData[index];
            if (!Number.isFinite(db)) continue;
            const magnitude = Math.pow(10, db / 20);
            const frequency = index * audioContext!.sampleRate / analyser.fftSize;
            magnitudeTotal += magnitude;
            weightedMagnitude += frequency * magnitude;
            if (db > peakMagnitude) {
              peakMagnitude = db;
              peakIndex = index;
            }
          }
          rmsTotal += Math.sqrt(sumSquares / timeData.length);
          peakFrequencyTotal += peakIndex * audioContext!.sampleRate / analyser.fftSize;
          centroidTotal += magnitudeTotal ? weightedMagnitude / magnitudeTotal : 0;
          sampleCount++;
          microphoneStatus = 'measured';
          animationFrameId = requestAnimationFrame(sample);
        };

        animationFrameId = requestAnimationFrame(sample);
      }).catch((error) => {
        microphoneStatus = classifyError(error);
        stopMicrophone();
      });
    } catch {
      microphoneStatus = 'unavailable';
      stopMicrophone();
    }
  }

  const SensorWindow = window as any;
  if (SensorWindow.AmbientLightSensor) {
    try {
      ambientLightSensor = new SensorWindow.AmbientLightSensor({ frequency: 1 });
      ambientLightSensor.onreading = () => {
        const value = Number(ambientLightSensor.illuminance);
        if (Number.isFinite(value)) {
          ambientLightTotal += value;
          ambientLightReadings++;
          ambientLightStatus = 'measured';
        }
      };
      ambientLightSensor.onerror = (event: any) => {
        ambientLightStatus = classifyError(event.error);
      };
      ambientLightSensor.start();
      ambientLightStatus = 'permission-pending';
    } catch (error) {
      ambientLightStatus = classifyError(error);
    }
  }

  if (SensorWindow.Magnetometer) {
    try {
      magnetometer = new SensorWindow.Magnetometer({ frequency: 1 });
      magnetometer.onreading = () => {
        const x = Number(magnetometer.x);
        const y = Number(magnetometer.y);
        const z = Number(magnetometer.z);
        if ([x, y, z].every(Number.isFinite)) {
          magneticXTotal += x;
          magneticYTotal += y;
          magneticZTotal += z;
          magneticReadings++;
          magneticFieldStatus = 'measured';
        }
      };
      magnetometer.onerror = (event: any) => {
        magneticFieldStatus = classifyError(event.error);
      };
      magnetometer.start();
      magneticFieldStatus = 'permission-pending';
    } catch (error) {
      magneticFieldStatus = classifyError(error);
    }
  }

  const finish = (): ScanEnvironmentMeasurements => {
    finalized = true;
    stopMicrophone();
    try {
      stopSensor(ambientLightSensor);
    } catch {
      ambientLightStatus = ambientLightReadings ? 'measured' : 'unavailable';
    }
    try {
      stopSensor(magnetometer);
    } catch {
      magneticFieldStatus = magneticReadings ? 'measured' : 'unavailable';
    }
    if (ambientLightStatus === 'permission-pending') ambientLightStatus = ambientLightReadings ? 'measured' : 'unavailable';
    if (magneticFieldStatus === 'permission-pending') magneticFieldStatus = magneticReadings ? 'measured' : 'unavailable';
    if (microphoneStatus === 'permission-pending' || (microphoneStatus === 'measured' && sampleCount === 0)) microphoneStatus = 'unavailable';
    const durationSeconds = Math.max(0, (Date.now() - startedAt) / 1000);
    const meanX = magneticReadings ? magneticXTotal / magneticReadings : undefined;
    const meanY = magneticReadings ? magneticYTotal / magneticReadings : undefined;
    const meanZ = magneticReadings ? magneticZTotal / magneticReadings : undefined;

    return {
      capturedAt: Date.now(),
      durationSeconds: Math.round(durationSeconds),
      microphone: {
        status: microphoneStatus,
        relativeLevelPercent: sampleCount ? Math.round(Math.sqrt(rmsTotal / sampleCount) * 10000) / 100 : undefined,
        dominantFrequencyHz: sampleCount ? Math.round(peakFrequencyTotal / sampleCount) : undefined,
        spectralCentroidHz: sampleCount ? Math.round(centroidTotal / sampleCount) : undefined,
      },
      ambientLight: {
        status: ambientLightReadings ? 'measured' : ambientLightStatus,
        value: ambientLightReadings ? Math.round(ambientLightTotal / ambientLightReadings * 10) / 10 : undefined,
        unit: 'lx',
      },
      magneticField: {
        status: magneticReadings ? 'measured' : magneticFieldStatus,
        xMicrotesla: meanX,
        yMicrotesla: meanY,
        zMicrotesla: meanZ,
        magnitudeMicrotesla: meanX === undefined ? undefined : Math.round(Math.sqrt(meanX ** 2 + meanY! ** 2 + meanZ! ** 2) * 100) / 100,
      },
    };
  };

  return {
    finish,
    cancel: () => {
      finalized = true;
      stopMicrophone();
      try { stopSensor(ambientLightSensor); } catch {}
      try { stopSensor(magnetometer); } catch {}
    },
  };
}
