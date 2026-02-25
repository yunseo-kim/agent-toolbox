---
name: video-frames
description: >
  Extract frames or short clips from videos using ffmpeg. Quick thumbnails
  and frame extraction at specific timestamps.

metadata:
  domain: content-media
  subdomain: media-processing
  tags: "ffmpeg, video, frames, extraction, cli"
---

# Video Frames (ffmpeg)

Extract a single frame from a video, or create quick thumbnails for inspection.

## Quick start

First frame:

```bash
{skillDir}/scripts/frame.sh /path/to/video.mp4 --out /tmp/frame.jpg
```

At a timestamp:

```bash
{skillDir}/scripts/frame.sh /path/to/video.mp4 --time 00:00:10 --out /tmp/frame-10s.jpg
```

## Notes

- Prefer `--time` for “what is happening around here?”.
- Use a `.jpg` for quick share; use `.png` for crisp UI frames.
