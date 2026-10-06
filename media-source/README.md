# Media Source Extensions

Vanilla JS demo of **segmented playback** and **adaptive bitrate** with `MediaSource` and `SourceBuffer`.

Companion to the Frontend System Design series on [I Code It](https://www.youtube.com/@icodeit.juntao).

FFmpeg packages the file. The browser only fetches segments and appends them — it does not slice an MP4.

```text
Original video
    ↓
FFmpeg / DASH packaging (480p, 720p, 1080p)
    ↓
init.m4s + segment-001.m4s …  (aligned across qualities)
    ↓
observe bandwidth + buffer ahead
    ↓
choose quality → fetch → SourceBuffer.appendBuffer()
    ↓
MediaSource → HTMLVideoElement
```

## Modes

1. **Native Video** — `<video src="/video/original.mp4">`. The browser loads the file itself.
2. **Basic MSE** — blob URL + `MediaSource`. Append 1080p `init.m4s`, then the first media segment, then play.
3. **Streaming Demo** — append init + two segments and stop. Playback stalls when `video.buffered` runs out. **Load Next Segment** grows the buffer.
4. **Adaptive** — `loadSegment(index, quality)`. A network simulator (Fast / Medium / Slow) delays downloads. The player estimates bandwidth, looks at buffer ahead, and picks 480p / 720p / 1080p for the next segment.

We do not parse `manifest.mpd`. Qualities are listed in `ui/src/config.js`, the same information a DASH manifest would provide.

## Teaching snippets

Plain walkthrough files in [`snippets/`](./snippets/) — not wired into the app:

1. [`01-native-video.js`](./snippets/01-native-video.js) — baseline `<video src>`
2. [`02-mse-basic.js`](./snippets/02-mse-basic.js) — blob URL, `addSourceBuffer`, init then first segment
3. [`03-mse-streaming.js`](./snippets/03-mse-streaming.js) — `loadSegment(index)` until the buffer runs out
4. [`04-choose-quality.js`](./snippets/04-choose-quality.js) — pick 480p / 720p / 1080p from estimated bitrate
5. [`05-abr.js`](./snippets/05-abr.js) — observe → decide → `loadSegment(index, quality)`

## Run the demo

```bash
# From repo root
npm run setup:media-source
npm run dev:media-source
```

Open [http://localhost:5175](http://localhost:5175). Use **Streaming Demo** to see a stall, then **Adaptive** and switch Fast → Slow to watch quality drop.

## Sample media

`ui/public/video/original.mp4` is the source clip. Package three aligned renditions with:

```bash
npm run segment-qualities --prefix media-source
```

That writes:

```text
ui/public/video/
├── original.mp4
├── 480p/init.m4s, segment-001.m4s, …
├── 720p/…
└── 1080p/…
```

Keyframe times match across folders, so `segment-003` is the same 4-second window at every quality. That is what makes mid-stream switching possible.
