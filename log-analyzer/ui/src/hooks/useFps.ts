import { useEffect, useRef, useState } from "react";

export function useFps(): number {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastSample = useRef(performance.now());

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      frameCount.current += 1;
      const elapsed = now - lastSample.current;

      if (elapsed >= 500) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastSample.current = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
