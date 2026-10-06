// SourceBuffer.appendBuffer() must not be called while updating.
// Wait for the current update, append, then resolve on updateend.

export function appendBuffer(sourceBuffer, data) {
  return new Promise((resolve, reject) => {
    const start = () => {
      const onEnd = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("SourceBuffer error"));
      };
      const cleanup = () => {
        sourceBuffer.removeEventListener("updateend", onEnd);
        sourceBuffer.removeEventListener("error", onError);
      };

      sourceBuffer.addEventListener("updateend", onEnd);
      sourceBuffer.addEventListener("error", onError);

      try {
        sourceBuffer.appendBuffer(data);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    if (sourceBuffer.updating) {
      sourceBuffer.addEventListener("updateend", start, { once: true });
    } else {
      start();
    }
  });
}

export async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`fetch failed: ${url} (${response.status})`);
  }
  return response.arrayBuffer();
}

export function waitForEvent(target, type) {
  return new Promise((resolve) => {
    target.addEventListener(type, resolve, { once: true });
  });
}

// video.buffered is read-only playback info on the <video> element.
// It is not the SourceBuffer object that appendBuffer() writes to.
export function getBufferedRange(video) {
  const { buffered } = video;
  if (!buffered.length) return { start: 0, end: 0 };
  return {
    start: buffered.start(0),
    end: buffered.end(buffered.length - 1),
  };
}

export function getBufferAhead(video) {
  return Math.max(0, getBufferedRange(video).end - video.currentTime);
}

export function formatSeconds(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}s`;
}
