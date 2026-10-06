// Example 3 — append media segments one at a time
//
// Idea: a segment is a packaged piece of media from FFmpeg / DASH.
// It is not mp4Bytes.slice(...). Frontend JS only fetches and appends.
//
// Load init + the first couple of segments, then stop. Playback stalls
// when video.buffered runs out. loadSegment(index) grows the buffer.
//
// Part 2 can evolve this into loadSegment(index, quality).

const segments = [
  "/video/1080p/segment-001.m4s",
  "/video/1080p/segment-002.m4s",
  "/video/1080p/segment-003.m4s",
  "/video/1080p/segment-004.m4s",
];

await appendBuffer(sourceBuffer, await fetchBytes("/video/1080p/init.m4s"));
await loadSegment(0);
await loadSegment(1);

// buffer runs out → playback waits
// click "Load Next Segment" → append → playback can continue

async function loadSegment(index) {
  const bytes = await fetchBytes(segments[index]);
  await appendBuffer(sourceBuffer, bytes);
}

function bufferAhead(video) {
  const end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
  return end - video.currentTime;
}

// Optional: if (bufferAhead(video) < 6) loadSegment(nextIndex)
