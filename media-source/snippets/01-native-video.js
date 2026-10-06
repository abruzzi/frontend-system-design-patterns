// Example 1 — native <video src> playback
//
// Idea: point the element at a file URL. The browser fetches, buffers,
// and decodes on its own. This is the baseline to compare with MediaSource.

const video = document.querySelector("video");

video.src = "/video/original.mp4";
