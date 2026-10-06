// First idea: pick quality from estimated download bitrate.
// If the buffer is almost empty, prefer a small segment even if the
// last measurement looked fast — network numbers are noisy.

import { BUFFER_PANIC_S, QUALITIES } from "./config.js";

export function chooseQuality({ bandwidth, bufferAhead }) {
  if (bufferAhead > 0 && bufferAhead < BUFFER_PANIC_S) {
    return "480p";
  }

  if (bandwidth > 6_000_000) {
    return "1080p";
  }

  if (bandwidth > 3_000_000) {
    return "720p";
  }

  return "480p";
}

export function formatBitrate(bitsPerSecond) {
  if (!Number.isFinite(bitsPerSecond) || bitsPerSecond <= 0) return "—";
  return `${(bitsPerSecond / 1_000_000).toFixed(1)} Mbps`;
}

export function qualityBitrate(name) {
  return qualityByNameSafe(name)?.bitrate ?? 0;
}

function qualityByNameSafe(name) {
  return QUALITIES.find((item) => item.name === name);
}
