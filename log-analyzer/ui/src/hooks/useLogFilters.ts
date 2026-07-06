import { useEffect, useMemo, useState } from "react";

import { datasetAnchorMs, resolveTimeRange } from "../lib/timeRange";
import type { LevelFilter, LogEntry, LogQuery, TimeRangePreset } from "../types/log";
import { DEBOUNCE_MS, PAGE_SIZE } from "../types/log";
import { useDebouncedValue } from "./useDebouncedValue";

export function useLogFilters(logs: LogEntry[]) {
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState<LevelFilter>("ALL");
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("4h");
  const [page, setPage] = useState(1);

  const debouncedKeyword = useDebouncedValue(keyword, DEBOUNCE_MS);

  const anchorMs = useMemo(() => datasetAnchorMs(logs), [logs]);
  const timeWindow = useMemo(
    () => resolveTimeRange(timeRange, anchorMs, logs),
    [timeRange, anchorMs, logs]
  );

  const query = useMemo<LogQuery>(
    () => ({
      keyword: debouncedKeyword,
      level,
      fromMs: timeWindow.fromMs,
      toMs: timeWindow.toMs,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedKeyword, level, page, timeWindow.fromMs, timeWindow.toMs]
  );

  useEffect(() => {
    setPage(1);
  }, [keyword, level, timeRange]);

  return {
    keyword,
    level,
    timeRange,
    page,
    timeWindow,
    query,
    setKeyword,
    setLevel,
    setTimeRange,
    setPage,
  };
}
