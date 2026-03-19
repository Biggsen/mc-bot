import { writeFileSync } from "fs";
import type { Bot } from "mineflayer";
import type { VillageRecorderConfig } from "../../config/env.js";
import { log, error } from "../../utils/logger.js";
import { parseVillagesCsv, type ParsedCsv } from "./parseCsv.js";

const TP_CHECK_MS = 100;
const GROUND_VELOCITY_EPS = 0.25;
const GROUND_POS_EPS = 1.0;
const MIN_DROP_BELOW_TP = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatRow(header: string[], row: Record<string, string>, sep: string): string {
  return header.map((h) => row[h] ?? "").join(sep);
}

function writeOutput(
  parsed: ParsedCsv,
  results: { row: Record<string, string>; y: number }[],
  outputPath: string
): void {
  const lines: string[] = [];
  for (const line of parsed.commentLines) {
    lines.push(line);
  }
  const outHeader = [...parsed.header];
  if (!outHeader.some((h) => h.toLowerCase() === "y")) {
    outHeader.push("y");
  }
  lines.push(outHeader.join(parsed.separator));

  const yKey = outHeader.find((h) => h.toLowerCase() === "y") ?? "y";
  for (const { row, y } of results) {
    const outRow = { ...row, [yKey]: String(Math.floor(y)) };
    lines.push(formatRow(outHeader, outRow, parsed.separator));
  }

  writeFileSync(outputPath, lines.join("\n"), "utf-8");
  log("Wrote %d rows to %s", results.length, outputPath);
}

const MODE_SWITCH_DELAY_MS = 1500;

export async function runVillageRecorder(
  bot: Bot,
  config: VillageRecorderConfig
): Promise<void> {
  const parsed = parseVillagesCsv(config.csvPath);
  if (parsed.rows.length === 0) {
    log("No village rows to process");
    writeOutput(parsed, [], config.outputPath);
    return;
  }

  log("Switching to survival with Resistance (invincible) so bot falls to ground...");
  bot.chat("/effect give @s resistance 1000000 255 true");
  bot.chat("/gamemode survival");
  await sleep(MODE_SWITCH_DELAY_MS);

  try {
    const results: { row: Record<string, string>; y: number }[] = [];
    const xKey = parsed.header.find((h) => h.toLowerCase() === "x") ?? "x";
    const zKey = parsed.header.find((h) => h.toLowerCase() === "z") ?? "z";

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const x = parseInt(row[xKey], 10);
      const z = parseInt(row[zKey], 10);

      try {
        bot.chat(`/tp @s ${x} ${config.tpY} ${z}`);
      } catch (e) {
        error("TP failed for village %d (%d, %d): %s", i + 1, x, z, (e as Error).message);
        continue;
      }

      await sleep(config.delayAfterTpMs);

      if (config.waitForGround) {
        const deadline = Date.now() + config.groundTimeoutMs;
        const tpY = config.tpY;
        let lastY = bot.entity.position.y;
        let stableTicks = 0;
        const requiredStable = 2;

        while (Date.now() < deadline) {
          await sleep(TP_CHECK_MS);
          const pos = bot.entity.position;
          const vel = bot.entity.velocity.y;
          const hasDropped = pos.y < tpY - MIN_DROP_BELOW_TP;
          const dy = Math.abs(pos.y - lastY);
          const isStable =
            hasDropped &&
            Math.abs(vel) < GROUND_VELOCITY_EPS &&
            dy < GROUND_POS_EPS;
          if (isStable) {
            stableTicks++;
            if (stableTicks >= requiredStable) break;
          } else {
            stableTicks = 0;
          }
          lastY = pos.y;
        }
        if (stableTicks < requiredStable) {
          error(
            "Timeout waiting for ground at village %d (%d, %d), using current Y",
            i + 1,
            x,
            z
          );
        }
      }

      const y = bot.entity.position.y;
      results.push({ row, y });
      log("Village %d/%d: %d, %d → y=%d", i + 1, parsed.rows.length, x, z, Math.floor(y));
    }

    writeOutput(parsed, results, config.outputPath);
  } finally {
    log("Restoring creative and clearing effects.");
    bot.chat("/gamemode creative");
    bot.chat("/effect clear @s");
  }
}
