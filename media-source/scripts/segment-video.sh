#!/usr/bin/env bash
# Part 1 single-rendition packaging (1080p only).
# For adaptive bitrate, use scripts/segment-qualities.sh instead.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO="$ROOT/ui/public/video"
mkdir -p "$VIDEO"

ffmpeg -y \
  -i "$VIDEO/original.mp4" \
  -an \
  -c:v libx264 -preset veryfast \
  -pix_fmt yuv420p \
  -profile:v high -level 4.0 \
  -force_key_frames "expr:gte(t,n_forced*4)" \
  -f dash \
  -seg_duration 4 \
  -init_seg_name "init.m4s" \
  -media_seg_name "segment-\$Number%03d\$.m4s" \
  "$VIDEO/manifest.mpd"

echo "Wrote segments to $VIDEO"
ls -lh "$VIDEO"
