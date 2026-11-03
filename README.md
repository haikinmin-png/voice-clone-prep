# voice-clone-prep

**Check the take before you spend the clone slot.**

[中文说明](README.zh-CN.md)

One-sentence voice cloning is sold by the voice, not by the attempt — and
the input window is tiny (typically **5–15 seconds** of clean speech).
Record it wrong and you burn a paid slot on a thin, noisy, or clipped
clone. The usual failure modes are all measurable *before* upload:

- ⏱️ **duration** outside the 5–15s window
- 💥 **clipping** from recording too hot or too close
- 🔇 **silence ratio** — long pauses eating the sample window
- 📉 **loudness** — too quiet reads as thin and noisy after cloning

`voice-clone-prep` parses WAV in pure JS (PCM16 / float32, zero
dependencies) and gives a pass/fail with reasons and fixes:

```bash
npx voice-clone-prep my-take.wav
```

```json
{
  "pass": false,
  "issues": ["Too much silence (58%) — long pauses waste the sample window"],
  "tips": ["Peak level is low; speak closer to the mic (15-20cm) in a quiet, soft room"],
  "stats": { "durationSec": 12.4, "rmsDb": -24.3, "peakDb": -9.1, "clippingRatio": 0, "silenceRatio": 0.58 }
}
```

## Recording guidance that pairs with this tool

Quiet room, soft surfaces (a wardrobe works), phone in airplane mode,
mic 15–20cm away, natural speaking voice — not a "presenter" voice.
Record WAV, not a voice message; voice messages are compressed past
what cloning wants. Record three takes and check them all; keep the
best, not the first.

## Roadmap

MP3/M4A decoding adapters, SNR estimation, multi-take ranking, a
"full-tier" profile (longer material) for premium clone tiers.
See `docs/roadmap.md`.

## License

MIT
