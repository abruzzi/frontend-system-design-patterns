export const MIME_TYPE = 'video/mp4; codecs="avc1.640028"';
export const ORIGINAL_URL = "/video/original.mp4";
export const SEGMENT_COUNT = 8;
export const SEGMENT_DURATION_S = 4;
export const STREAMING_PRELOAD_COUNT = 2;
export const AUTO_LOAD_THRESHOLD_S = 6;
export const BUFFER_PANIC_S = 4;

// Same timeline, three bitrates. Segment N is the same 4s window at every quality.
export const QUALITIES = [
    {name: "480p", bitrate: 1_000_000, baseUrl: "/video/480p"},
    {name: "720p", bitrate: 2_500_000, baseUrl: "/video/720p"},
    {name: "1080p", bitrate: 5_000_000, baseUrl: "/video/1080p"},
];

export const DEFAULT_QUALITY = "1080p";

export function qualityByName(name) {
    return QUALITIES.find((item) => item.name === name);
}

export function initUrl(quality) {
    return `${qualityByName(quality).baseUrl}/init.m4s`;
}

export function segmentUrl(quality, index) {
    const n = String(index + 1).padStart(3, "0");
    return `${qualityByName(quality).baseUrl}/segment-${n}.m4s`;
}

// Part 1 modes use a single 1080p rendition.
export const INIT_URL = initUrl(DEFAULT_QUALITY);
export const SEGMENT_URLS = Array.from({length: SEGMENT_COUNT}, (_, index) =>
    segmentUrl(DEFAULT_QUALITY, index),
);

export const NETWORK_PROFILES = {
    fast: {id: "fast", label: "Fast", bitsPerSecond: 8_000_000},
    medium: {id: "medium", label: "Medium", bitsPerSecond: 4_000_000},
    slow: {id: "slow", label: "Slow", bitsPerSecond: 800_000},
};
