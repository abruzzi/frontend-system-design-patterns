import { useEffect, useRef, useState } from "react";

export interface FpsSample {
  /** Rolling average over the last ~500ms window */
  avg: number;
  /** Worst single frame in that window — drops when the main thread blocks */
  min: number;
}

export function useFps(): FpsSample {
  const [fps, setFps] = useState<FpsSample>({ avg: 60, min: 60 });
  const frameCount = useRef(0);
  const lastSample = useRef(performance.now());
  const lastFrame = useRef(performance.now());
  const maxFrameMs = useRef(0);

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      const frameMs = now - lastFrame.current;
      lastFrame.current = now;

      if (frameMs > 0) {
        maxFrameMs.current = Math.max(maxFrameMs.current, frameMs);
      }

      frameCount.current += 1;
      const elapsed = now - lastSample.current;

      if (elapsed >= 500) {
        const avg = Math.round((frameCount.current * 1000) / elapsed);
        const min =
          maxFrameMs.current === 0
            ? avg
            : Math.max(1, Math.round(1000 / maxFrameMs.current));

        setFps({ avg, min });
        frameCount.current = 0;
        lastSample.current = now;
        maxFrameMs.current = 0;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
