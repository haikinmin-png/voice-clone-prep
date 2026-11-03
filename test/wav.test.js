import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWav, checkForOneSentenceClone } from '../src/index.js';

// Synthesize a PCM16 mono WAV in memory.
function makeWav({ seconds = 10, sampleRate = 16000, amplitude = 0.25, freq = 440, silenceHeadSec = 0, clip = false } = {}) {
  const total = Math.floor(seconds * sampleRate);
  const silence = Math.floor(silenceHeadSec * sampleRate);
  const data = Buffer.alloc(total * 2);
  for (let i = 0; i < total; i++) {
    let v = i < silence ? 0 : Math.sin((2 * Math.PI * freq * i) / sampleRate) * amplitude;
    if (clip) v = Math.max(-1, Math.min(1, v * 4));
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

test('analyze: duration, loudness and silence are measured', () => {
  const stats = analyzeWav(makeWav({ seconds: 10, amplitude: 0.25 }));
  assert.equal(stats.durationSec, 10);
  assert.ok(stats.rmsDb > -16 && stats.rmsDb < -13, `rms ${stats.rmsDb}`);
  assert.equal(stats.clippingRatio, 0);
  assert.ok(stats.silenceRatio < 0.05);
});

test('check: a clean 10s take passes', () => {
  const result = checkForOneSentenceClone(analyzeWav(makeWav({})));
  assert.equal(result.pass, true, result.issues.join('; '));
});

test('check: too short, clipped, and mostly-silent takes fail with reasons', () => {
  const short = checkForOneSentenceClone(analyzeWav(makeWav({ seconds: 3 })));
  assert.equal(short.pass, false);
  assert.ok(short.issues.some((i) => /Too short/.test(i)));

  const clipped = checkForOneSentenceClone(analyzeWav(makeWav({ amplitude: 0.9, clip: true })));
  assert.equal(clipped.pass, false);
  assert.ok(clipped.issues.some((i) => /Clipping/.test(i)));

  const silent = checkForOneSentenceClone(analyzeWav(makeWav({ seconds: 10, silenceHeadSec: 6 })));
  assert.equal(silent.pass, false);
  assert.ok(silent.issues.some((i) => /silence/.test(i)));
});

test('parse: non-WAV input is rejected clearly', () => {
  assert.throws(() => analyzeWav(Buffer.from('not audio')), /Not a WAV/);
});
