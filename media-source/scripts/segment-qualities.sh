#!/usr/bin/env bash
# Package original.mp4 into aligned 480p / 720p / 1080p DASH segments.
# Same GOP / keyframe times so segment-003 is the same 4s window at every quality.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO="$ROOT/ui/public/video"
SOURCE="$VIDEO/original.mp4"

if [[ ! -f "$SOURCE" ]]; then
  echo "Missing $SOURCE" >&2
  exit 1
fi

# GOP = 4s at 24fps. scenecut=0 keeps keyframes aligned across renditions.
X264_PARAMS="keyint=96:min-keyint=96:scenecut=0"

encode_quality() {
  local name="$1"
  local width="$2"
  local height="$3"
  local bitrate="$4"
  local bufsize="$5"
  local out="$VIDEO/$name"

  mkdir -p "$out"
  rm -f "$out"/*.m4s "$out"/*.mpd

  echo "Encoding $name (${width}x${height} @ ${bitrate})..."
  ffmpeg -y -i "$SOURCE" \
    -an \
    -c:v libx264 -preset veryfast \
    -pix_fmt yuv420p \
    -profile:v high -level 4.0 \
    -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2" \
    -b:v "$bitrate" -maxrate "$bitrate" -bufsize "$bufsize" \
    -force_key_frames "expr:gte(t,n_forced*4)" \
    -x264-params "$X264_PARAMS" \
    -f dash \
    -seg_duration 4 \
    -init_seg_name "init.m4s" \
    -media_seg_name "segment-\$Number%03d\$.m4s" \
    "$out/manifest.mpd"
}

encode_quality "480p" 854 480 "1000k" "2000k"
encode_quality "720p" 1280 720 "2500k" "5000k"
encode_quality "1080p" 1920 1080 "5000k" "10000k"

echo
echo "Wrote aligned renditions to $VIDEO/{480p,720p,1080p}"
ls -lh "$VIDEO"/480p "$VIDEO"/720p "$VIDEO"/1080p
