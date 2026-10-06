import { INIT_URL, MIME_TYPE, SEGMENT_URLS } from "./config.js";
import { appendBuffer, fetchBytes, waitForEvent } from "./buffer-utils.js";

// Attach a MediaSource, append init + the first media segment, then play.
export async function startBasicMse(video, { onState } = {}) {
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

  const emit = () =>
    onState?.({
      objectUrl,
      mediaSource,
      sourceBuffer,
      loaded,
      nextIndex: 1,
      loading: false,
      hasNext: false,
    });

  emit();

  await appendBuffer(sourceBuffer, await fetchBytes(INIT_URL));
  loaded.add("init");
  emit();

  await appendBuffer(sourceBuffer, await fetchBytes(SEGMENT_URLS[0]));
  loaded.add(0);
  emit();

  if (mediaSource.readyState === "open") {
    mediaSource.endOfStream();
  }

  await video.play().catch(() => {});

  return {
    async loadNextSegment() {
      return false;
    },
    destroy() {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    },
  };
}
