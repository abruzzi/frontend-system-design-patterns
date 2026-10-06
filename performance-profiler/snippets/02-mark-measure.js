// Example 2 — name stages with mark() / measure()
//
// Idea: wrap each stage so you can compare them.
// Now you can see *which* part is slow (usually search).

performance.mark("search-start");

const matchedLogs = searchLogs(logs, query.keyword);

performance.mark("search-end");
performance.measure("search", "search-start", "search-end");

performance.mark("filter-start");

const filteredLogs = filterLogs(matchedLogs, query);

performance.mark("filter-end");
performance.measure("filter", "filter-start", "filter-end");

performance.mark("aggregate-start");

const aggregations = aggregateLogs(filteredLogs);

performance.mark("aggregate-end");
performance.measure("aggregate", "aggregate-start", "aggregate-end");

console.table(
  performance.getEntriesByType("measure").map(({ name, duration }) => ({
    name,
    duration: `${duration.toFixed(2)}ms`,
  }))
);
