// Example 5 — ABR loop: observe, decide, fetch, append
//
// Idea: bandwidth is noisy. Also look at how many seconds are already
// buffered. If playback is about to stall, fetch a small 480p segment
// even if the last measurement looked fast.
//
// loadSegment(index, quality) is Part 1's loadSegment(index) with a
// second argument. Same SourceBuffer, same appendBuffer.

function chooseQuality({ bandwidth, bufferAhead }) {
  if (bufferAhead < 4) return "480p";
  if (bandwidth > 6_000_000) return "1080p";
  if (bandwidth > 3_000_000) return "720p";
  return "480p";
}

async function loadNext() {
  const bandwidth = estimateBandwidth();
  const bufferAhead = bufferedEnd(video) - video.currentTime;
  const quality = chooseQuality({ bandwidth, bufferAhead });
  await loadSegment(nextIndex, quality);
}

// observe → decide → fetch → append → observe again
