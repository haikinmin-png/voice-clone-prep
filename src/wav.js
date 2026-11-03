// Minimal WAV reader: PCM16 and float32, mono or stereo (mixed to mono).
export function parseWav(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a WAV file');
  }
  let fmt = null;
  let data = null;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ') {
      fmt = {
        format: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    } else if (id === 'data') {
      data = buffer.subarray(start, start + size);
    }
    offset = start + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('WAV is missing fmt or data chunk');
  if (fmt.format !== 1 && fmt.format !== 3) throw new Error(`Unsupported WAV format: ${fmt.format} (need PCM or float)`);

  const bytesPerSample = fmt.bitsPerSample / 8;
  const frameCount = Math.floor(data.length / bytesPerSample / fmt.channels);
  const samples = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i++) {
    let sum = 0;
    for (let ch = 0; ch < fmt.channels; ch++) {
      const pos = (i * fmt.channels + ch) * bytesPerSample;
      if (fmt.format === 3 && fmt.bitsPerSample === 32) sum += data.readFloatLE(pos);
      else if (fmt.bitsPerSample === 16) sum += data.readInt16LE(pos) / 32768;
      else if (fmt.bitsPerSample === 8) sum += (data[pos] - 128) / 128;
      else throw new Error(`Unsupported bit depth: ${fmt.bitsPerSample}`);
    }
    samples[i] = sum / fmt.channels;
  }
  return { sampleRate: fmt.sampleRate, channels: fmt.channels, samples };
}

const toDb = (x) => (x <= 0 ? -Infinity : 20 * Math.log10(x));

export function analyzeWav(buffer) {
  const { sampleRate, samples } = parseWav(buffer);
  const durationSec = samples.length / sampleRate;
  let peak = 0;
  let sumSquares = 0;
  let clipped = 0;
  for (const s of samples) {
    const a = Math.abs(s);
    if (a > peak) peak = a;
    sumSquares += s * s;
    if (a >= 0.999) clipped += 1;
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, samples.length));

  // Silence ratio: fraction of 20ms frames whose RMS sits below -45 dBFS.
  const frameSize = Math.max(1, Math.floor(sampleRate * 0.02));
  let silentFrames = 0;
  let frames = 0;
  for (let start = 0; start < samples.length; start += frameSize) {
    let fs = 0;
    const end = Math.min(samples.length, start + frameSize);
    for (let i = start; i < end; i++) fs += samples[i] * samples[i];
    const frameRms = Math.sqrt(fs / (end - start));
    if (toDb(frameRms) < -45) silentFrames += 1;
    frames += 1;
  }

  return {
    durationSec: Number(durationSec.toFixed(2)),
    sampleRate,
    peakDb: Number(toDb(peak).toFixed(1)),
    rmsDb: Number(toDb(rms).toFixed(1)),
    clippingRatio: samples.length ? clipped / samples.length : 0,
    silenceRatio: frames ? silentFrames / frames : 0,
  };
}
