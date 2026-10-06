import {
  INIT_URL,
  MIME_TYPE,
  SEGMENT_URLS,
  STREAMING_PRELOAD_COUNT,
} from "./config.js";
import { appendBuffer, fetchBytes, waitForEvent } from "./buffer-utils.js";

// Load init + a couple of media segments, then stop.
// Call loadSegment(index) / loadNextSegment() to grow the buffer.
export async function startStreamingDemo(video, { onState } = {}) {
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
  const loaded = new Set();
  let nextIndex = 0;
  let loading = false;

  const emit = () =>
    onState?.({
      objectUrl,
      mediaSource,
      sourceBuffer,
      loaded,
      nextIndex,
      loading,
      hasNext: nextIndex < SEGMENT_URLS.length,
    });

  emit();

  await appendBuffer(sourceBuffer, await fetchBytes(INIT_URL));
  loaded.add("init");
  emit();

  const preload = Math.min(STREAMING_PRELOAD_COUNT, SEGMENT_URLS.length);
  for (let i = 0; i < preload; i++) {
    await loadSegment(i);
  }

  await video.play().catch(() => {});

  async function loadSegment(index) {
    if (index < 0 || index >= SEGMENT_URLS.length) return false;
    if (loaded.has(index) || loading) return false;

    loading = true;
    emit();
    try {
      await appendBuffer(sourceBuffer, await fetchBytes(SEGMENT_URLS[index]));
      loaded.add(index);
      nextIndex = Math.max(nextIndex, index + 1);

      if (
        [...loaded].filter((item) => typeof item === "number").length ===
          SEGMENT_URLS.length &&
        mediaSource.readyState === "open"
      ) {
        mediaSource.endOfStream();
      }

      return true;
    } finally {
      loading = false;
      emit();
    }
  }

  return {
    loadSegment,
    loadNextSegment() {
      return loadSegment(nextIndex);
    },
    destroy() {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    },
  };
}
