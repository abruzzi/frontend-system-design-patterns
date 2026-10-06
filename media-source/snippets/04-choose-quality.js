// Example 4 — choose the next quality from bandwidth
//
// Idea: after a segment finishes downloading, estimate bits/sec.
// Pick a ladder step that should fit. This is the first ABR signal.

function chooseQuality(bandwidth) {
  if (bandwidth > 6_000_000) return "1080p";
  if (bandwidth > 3_000_000) return "720p";
  return "480p";
}

const bandwidth = (downloadedBytes * 8) / downloadSeconds;
const quality = chooseQuality(bandwidth);

await loadSegment(nextIndex, quality);
