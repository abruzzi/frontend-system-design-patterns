import {
  MIME_TYPE,
  SEGMENT_COUNT,
  STREAMING_PRELOAD_COUNT,
  initUrl,
  segmentUrl,
} from "./config.js";
import { chooseQuality } from "./abr.js";
import {
  appendBuffer,
  fetchBytes,
  getBufferAhead,
  waitForEvent,
} from "./buffer-utils.js";
import { fetchThrottled } from "./network.js";

// Same MediaSource / SourceBuffer pipeline as Part 1.
// loadSegment(index, quality) is the Part 2 extension.
export async function startAbrDemo(video, { getBitsPerSecond, onState } = {}) {
  if (!("MediaSource" in window)) {
    throw new Error("MediaSource is not supported in this browser");
  }
  if (!MediaSource.isTypeSupported(MIME_TYPE)) {
    throw new Error(`unsupported MIME: ${MIME_TYPE}`);
  }

  const mediaSource = new MediaSource();
  const objectUrl = URL.createObjectURL(mediaSource);
  const opened = waitForEvent(mediaSource, "sourceopen");
  video.src = objectUrl;
  await opened;

  const sourceBuffer = mediaSource.addSourceBuffer(MIME_TYPE);
  const loaded = new Map();
  let nextIndex = 0;
  let loading = false;
  let activeQuality = null;
  let lastBandwidth = getBitsPerSecond?.() ?? 3_000_000;
  let chosenQuality = null;

  const emit = () =>
    onState?.({
      objectUrl,
      mediaSource,
      sourceBuffer,
      loaded,
      nextIndex,
      loading,
      hasNext: nextIndex < SEGMENT_COUNT,
      activeQuality,
      chosenQuality,
      lastBandwidth,
    });

  emit();

  async function switchInit(quality) {
    if (quality === activeQuality) return;
    if (activeQuality !== null && typeof sourceBuffer.changeType === "function") {
      try {
        sourceBuffer.changeType(MIME_TYPE);
      } catch {
        // Older browsers may reject changeType; the new init still follows.
      }
    }
    await appendBuffer(sourceBuffer, await fetchBytes(initUrl(quality)));
    activeQuality = quality;
  }

  async function loadSegment(index, quality) {
    if (index < 0 || index >= SEGMENT_COUNT) return false;
    if (loaded.has(index) || loading) return false;

    chosenQuality = quality;
    loading = true;
    emit();
    try {
      await switchInit(quality);
      const bitsPerSecond = getBitsPerSecond?.() ?? lastBandwidth;
      const { data, bandwidth } = await fetchThrottled(
        segmentUrl(quality, index),
        bitsPerSecond,
      );
      lastBandwidth = bandwidth;
      await appendBuffer(sourceBuffer, data);
      loaded.set(index, quality);
      nextIndex = Math.max(nextIndex, index + 1);

      if (loaded.size === SEGMENT_COUNT && mediaSource.readyState === "open") {
        mediaSource.endOfStream();
      }

      return true;
    } finally {
      loading = false;
      emit();
    }
  }

  async function loadNextSegment() {
    if (nextIndex >= SEGMENT_COUNT) return false;
    const profileBps = getBitsPerSecond?.() ?? lastBandwidth;
    const quality = chooseQuality({
      bandwidth: Math.min(lastBandwidth, profileBps),
      bufferAhead: getBufferAhead(video),
    });
    return loadSegment(nextIndex, quality);
  }

  const firstQuality = chooseQuality({
    bandwidth: lastBandwidth,
    bufferAhead: Number.POSITIVE_INFINITY,
  });
  const preload = Math.min(STREAMING_PRELOAD_COUNT, SEGMENT_COUNT);
  for (let i = 0; i < preload; i++) {
    const quality =
      i === 0
        ? firstQuality
        : chooseQuality({
            bandwidth: lastBandwidth,
            bufferAhead: getBufferAhead(video),
          });
    await loadSegment(i, quality);
  }

  await video.play().catch(() => {});

  return {
    loadSegment,
    loadNextSegment,
    destroy() {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    },
  };
}
