export function startNativeVideo(video, url) {
  video.src = url;

  return {
    destroy() {
      video.removeAttribute("src");
      video.load();
    },
  };
}
