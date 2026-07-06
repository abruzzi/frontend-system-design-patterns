import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateLogs, INCIDENT_ERROR } from "../src/logGenerator.js";

async function main(): Promise<void> {
  const count = Number(process.argv[2] ?? 50_000);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(__dirname, "../data/logs.json");

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const logs = generateLogs(count);
  await fs.writeFile(outputPath, JSON.stringify(logs));

  const stats = await fs.stat(outputPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  const incidentErrors = logs.filter((l) => l.message === INCIDENT_ERROR).length;

  process.stdout.write(
    `Generated ${logs.length.toLocaleString()} logs -> ${outputPath} (${sizeMb} MB)\n` +
      `  ${incidentErrors.toLocaleString()} repeated PriceCalculator.applyDiscount errors in payment-service/prod\n`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`generate-logs failed: ${message}\n`);
  process.exit(1);
});
