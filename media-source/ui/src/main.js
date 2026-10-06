import "./index.css";

import {
  AUTO_LOAD_THRESHOLD_S,
  NETWORK_PROFILES,
  ORIGINAL_URL,
  SEGMENT_COUNT,
  SEGMENT_DURATION_S,
  SEGMENT_URLS,
} from "./config.js";
import { formatBitrate } from "./abr.js";
import {
  formatSeconds,
  getBufferAhead,
  getBufferedRange,
} from "./buffer-utils.js";
import { startNativeVideo } from "./native-video.js";
import { startBasicMse } from "./mse-basic.js";
import { startStreamingDemo } from "./mse-streaming.js";
import { startAbrDemo } from "./mse-abr.js";

const MODE_LABELS = {
  native: "Native video",
  basic: "Basic MSE",
  streaming: "MSE streaming",
  abr: "Adaptive bitrate",
};

const player = document.querySelector("#player");
const modeButtons = document.querySelectorAll("[data-mode]");
const networkButtons = document.querySelectorAll("[data-network]");
const loadNextBtn = document.querySelector("#load-next");
const autoLoadInput = document.querySelector("#auto-load");
const streamingControls = document.querySelector("#streaming-controls");
const abrControls = document.querySelector("#abr-controls");
const segmentList = document.querySelector("#segment-list");
const statusEl = document.querySelector("#playback-status");
const metricMode = document.querySelector("#metric-mode");
const metricSrc = document.querySelector("#metric-src");
const metricTime = document.querySelector("#metric-time");
const metricBuffered = document.querySelector("#metric-buffered");
const metricAhead = document.querySelector("#metric-ahead");
const metricUpdating = document.querySelector("#metric-updating");
const metricBandwidth = document.querySelector("#metric-bandwidth");
const metricQuality = document.querySelector("#metric-quality");
const bufferFill = document.querySelector("#buffer-fill");
const playhead = document.querySelector("#playhead");

let mode = "native";
let networkId = "fast";
let session = null;
let mseState = null;

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    void switchMode(button.dataset.mode);
  });
});

networkButtons.forEach((button) => {
  button.addEventListener("click", () => {
    networkId = button.dataset.network;
    paintNetworkButtons();
    paint();
  });
});

loadNextBtn.addEventListener("click", () => {
  void session?.loadNextSegment?.();
});

player.addEventListener("timeupdate", paint);
player.addEventListener("progress", paint);
player.addEventListener("waiting", () => {
  if (mode === "streaming" || mode === "abr") {
    statusEl.textContent = "waiting — buffer empty";
  }
});
player.addEventListener("playing", () => {
  statusEl.textContent = "playing";
});
player.addEventListener("ended", () => {
  statusEl.textContent = "ended";
});

paintNetworkButtons();
renderSegmentList();
void switchMode("native");

async function switchMode(nextMode) {
  session?.destroy?.();
  session = null;
  mseState = null;
  mode = nextMode;
  statusEl.textContent = "idle";
  autoLoadInput.checked = false;
  streamingControls.classList.toggle("hidden", mode !== "streaming");
  streamingControls.classList.toggle("flex", mode === "streaming");
  abrControls.classList.toggle("hidden", mode !== "abr");
  abrControls.classList.toggle("flex", mode === "abr");
  renderSegmentList();
  paintModeButtons();
  paint();

  try {
    if (mode === "native") {
      session = startNativeVideo(player, ORIGINAL_URL);
    } else if (mode === "basic") {
      session = await startBasicMse(player, { onState: onMseState });
    } else if (mode === "streaming") {
      session = await startStreamingDemo(player, { onState: onMseState });
    } else {
      session = await startAbrDemo(player, {
        getBitsPerSecond: () => NETWORK_PROFILES[networkId].bitsPerSecond,
        onState: onMseState,
      });
    }
  } catch (err) {
    statusEl.textContent = err.message;
  }

  paint();
}

function onMseState(next) {
  mseState = next;
  renderSegmentList();
  paint();
}

function paint() {
  const range = getBufferedRange(player);
  const ahead = getBufferAhead(player);
  const duration = timelineDuration();
  const src = player.currentSrc || player.src || "—";

  metricMode.textContent = MODE_LABELS[mode];
  metricSrc.textContent = src;
  metricSrc.title = src;
  metricTime.textContent = formatSeconds(player.currentTime);
  metricBuffered.textContent =
    range.end > 0
      ? `${formatSeconds(range.start)} → ${formatSeconds(range.end)}`
      : "empty";
  metricAhead.textContent = formatSeconds(ahead);
  metricUpdating.textContent =
    mseState?.sourceBuffer?.updating === true
      ? "true"
      : mseState?.sourceBuffer
        ? "false"
        : "—";
  metricBandwidth.textContent =
    mode === "abr" ? formatBitrate(mseState?.lastBandwidth) : "—";
  metricQuality.textContent =
    mode === "abr" ? (mseState?.chosenQuality ?? mseState?.activeQuality ?? "—") : "—";

  const fillPct = duration ? (range.end / duration) * 100 : 0;
  const headPct = duration ? (player.currentTime / duration) * 100 : 0;
  bufferFill.style.width = `${Math.max(0, Math.min(100, fillPct))}%`;
  playhead.style.left = `${Math.max(0, Math.min(100, headPct))}%`;

  const canLoad =
    (mode === "streaming" || mode === "abr") &&
    mseState?.hasNext &&
    !mseState?.loading;
  loadNextBtn.disabled = !canLoad;

  const shouldAutoLoad =
    mseState?.hasNext &&
    !mseState?.loading &&
    ahead < AUTO_LOAD_THRESHOLD_S &&
    (mode === "abr" || (mode === "streaming" && autoLoadInput.checked));

  if (shouldAutoLoad) {
    void session?.loadNextSegment?.();
  }
}

function paintModeButtons() {
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("bg-sky-500/15", active);
    button.classList.toggle("text-sky-300", active);
    button.classList.toggle("text-zinc-400", !active);
  });
}

function paintNetworkButtons() {
  networkButtons.forEach((button) => {
    const active = button.dataset.network === networkId;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("bg-amber-500/15", active);
    button.classList.toggle("text-amber-300", active);
    button.classList.toggle("text-zinc-400", !active);
  });
}

function timelineDuration() {
  if (Number.isFinite(player.duration) && player.duration > 0) {
    return player.duration;
  }
  return SEGMENT_COUNT * SEGMENT_DURATION_S;
}

function renderSegmentList() {
  const loaded = mseState?.loaded;
  const items = [
    {
      label: "init.m4s",
      done:
        loaded instanceof Map
          ? loaded.size > 0
          : Boolean(loaded?.has?.("init")),
      extra: loaded instanceof Map ? (mseState?.activeQuality ?? "") : "",
    },
    ...SEGMENT_URLS.map((url, index) => {
      const quality = loaded instanceof Map ? loaded.get(index) : null;
      const done =
        loaded instanceof Map ? loaded.has(index) : Boolean(loaded?.has?.(index));
      return {
        label: url.split("/").pop(),
        done,
        extra: quality ?? "",
      };
    }),
  ];

  segmentList.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      li.className = "flex items-center gap-2 py-1 font-mono text-xs text-zinc-300";
      const mark = document.createElement("span");
      mark.className = item.done ? "text-emerald-400" : "text-zinc-600";
      mark.textContent = item.done ? "✓" : "○";
      const name = document.createElement("span");
      name.className = "flex-1";
      name.textContent = item.label;
      li.append(mark, name);
      if (item.extra) {
        const extra = document.createElement("span");
        extra.className = "text-amber-300";
        extra.textContent = item.extra;
        li.append(extra);
      }
      return li;
    }),
  );
}
