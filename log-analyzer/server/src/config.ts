export const config = {
  port: Number(process.env.PORT ?? 8790),
  dataPath: new URL("../data/logs.json", import.meta.url),
  defaultLogCount: 50_000,
} as const;
