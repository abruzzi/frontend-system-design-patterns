// Example 2 — MediaSource + SourceBuffer
//
// Idea: <video> does not point at original.mp4. It points at a MediaSource
// via a blob: URL. JavaScript fetches packaged segments and appends them.
//
// video/mp4  → container
// avc1....   → H.264 codec configuration
//
// Init segment first (tracks / codec setup), then a media segment (frames).

const mime = 'video/mp4; codecs="avc1.640028"';
const video = document.querySelector("video");

const mediaSource = new MediaSource();

if (!MediaSource.isTypeSupported(mime)) {
  throw new Error(`unsupported: ${mime}`);
}

video.src = URL.createObjectURL(mediaSource);
// video.src looks like blob:http://localhost:5175/...

mediaSource.addEventListener("sourceopen", async () => {
  const sourceBuffer = mediaSource.addSourceBuffer(mime);

  const init = await fetch("/video/1080p/init.m4s").then((r) => r.arrayBuffer());
  await appendBuffer(sourceBuffer, init);

  const first = await fetch("/video/1080p/segment-001.m4s").then((r) => r.arrayBuffer());
  await appendBuffer(sourceBuffer, first);

  video.play();
});

function appendBuffer(sourceBuffer, data) {
  return new Promise((resolve, reject) => {
    sourceBuffer.addEventListener("updateend", resolve, { once: true });
    sourceBuffer.addEventListener("error", reject, { once: true });
    sourceBuffer.appendBuffer(data);
  });
}
