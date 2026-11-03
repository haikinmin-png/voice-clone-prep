// Requirements for one-sentence voice cloning (the common fast tier across
// vendors): 5-15s of clean, single-speaker speech. Paid "full" tiers want
// longer material — adjust the window when targeting those.
export function checkForOneSentenceClone(stats, { minSec = 5, maxSec = 15 } = {}) {
  const issues = [];
  const tips = [];
  if (stats.durationSec < minSec) issues.push(`Too short: ${stats.durationSec}s (need ${minSec}-${maxSec}s)`);
  if (stats.durationSec > maxSec) issues.push(`Too long: ${stats.durationSec}s (need ${minSec}-${maxSec}s) — trim to one clean take`);
  if (stats.clippingRatio > 0.001) issues.push(`Clipping detected (${(stats.clippingRatio * 100).toFixed(2)}% of samples) — move the mic back or lower the gain`);
  if (stats.rmsDb < -30) { issues.push(`Very quiet (RMS ${stats.rmsDb} dBFS) — the clone will sound thin and noisy`); }
  if (stats.rmsDb > -9) tips.push(`Hot recording (RMS ${stats.rmsDb} dBFS) — watch for distortion even without hard clipping`);
  if (stats.silenceRatio > 0.4) issues.push(`Too much silence (${Math.round(stats.silenceRatio * 100)}%) — long pauses waste the sample window`);
  if (stats.peakDb < -12) tips.push('Peak level is low; speak closer to the mic (15-20cm) in a quiet, soft room');
  return { pass: issues.length === 0, issues, tips, stats };
}
