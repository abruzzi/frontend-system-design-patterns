import { fetchBytes } from "./buffer-utils.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Stretch the download so it *looks* like the selected network profile.
// bandwidth = bits / seconds, matching the Part 2 teaching snippet.
export async function fetchThrottled(url, bitsPerSecond) {
  const started = performance.now();
  const data = await fetchBytes(url);
  const minSeconds = bitsPerSecond > 0 ? (data.byteLength * 8) / bitsPerSecond : 0;
  const elapsedSeconds = (performance.now() - started) / 1000;
  if (elapsedSeconds < minSeconds) {
    await delay((minSeconds - elapsedSeconds) * 1000);
  }

  const seconds = (performance.now() - started) / 1000;
  const bandwidth = seconds > 0 ? (data.byteLength * 8) / seconds : 0;
  return { data, bytes: data.byteLength, seconds, bandwidth };
}
