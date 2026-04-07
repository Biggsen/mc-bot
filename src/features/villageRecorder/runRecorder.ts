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

function lowerHeader(h: string): string {
  return h.trim().toLowerCase();
}

/** Inserts y after x; columns that sat between x and z stay between y and z (e.g. Name,X,Foo,Z → Name,X,Y,Foo,Z). */
function buildOutputHeader(parsed: ParsedCsv): { outHeader: string[]; yKey: string } {
  const orig = parsed.header;
  const yKey = orig.find((h) => lowerHeader(h) === "y") ?? "y";
  const withoutY = orig.filter((h) => lowerHeader(h) !== "y");

  const xIdx = withoutY.findIndex((h) => lowerHeader(h) === "x");
  const zIdx = withoutY.findIndex((h) => lowerHeader(h) === "z");
  if (xIdx < 0 || zIdx < 0) {
    const outHeader = [...withoutY];
    if (!outHeader.some((h) => lowerHeader(h) === "y")) {
      outHeader.push(yKey);
    }
    return { outHeader, yKey };
  }

  const xH = withoutY[xIdx];
  const zH = withoutY[zIdx];
  const low = Math.min(xIdx, zIdx);
  const high = Math.max(xIdx, zIdx);
  const left = withoutY.slice(0, low);
  const mid = withoutY.slice(low + 1, high);
  const right = withoutY.slice(high + 1);
  const outHeader = [...left, xH, yKey, ...mid, zH, ...right];
  return { outHeader, yKey };
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
  const { outHeader, yKey } = buildOutputHeader(parsed);
  lines.push(outHeader.join(parsed.separator));

  for (const { row, y } of results) {
    const outRow = { ...row, [yKey]: String(Math.floor(y)) };
    lines.push(formatRow(outHeader, outRow, parsed.separator));
  }

  writeFileSync(outputPath, lines.join("\n"), "utf-8");
  log("Wrote %d rows to %s", results.length, outputPath);
}

const MODE_SWITCH_DELAY_MS = 1500;
/** Wall-clock cap per row for wait-for-ground + dig-to-chest (after TP delay). */
const ROW_ATTEMPT_TIMEOUT_MS = 30_000;
/** Same X,Z: scan this many blocks down from feet for chest (underwater: water above chest). */
const CHEST_COLUMN_SCAN_BLOCKS = 16;

const WOOD_SCAN_SIZE = 16;
/** South = +Z. Box is 16 wide (X), 16 tall (Y), 16 deep (Z), starting one block south of feet. */
const WOOD_SCAN_HALF = 7;
const WOOD_SCAN_Z0 = 1;

function isConsoleWoodAllowlist(name: string): boolean {
  if (name === "iron_trapdoor") return false;
  if (name.endsWith("_planks")) return true;
  if (name.endsWith("_log")) return true;
  if (name.endsWith("_wood")) return true;
  if (name.endsWith("_trapdoor")) return true;
  return false;
}

/**
 * Face south (+Z) by looking at a point south of the bot, then log matching blocks in the scan box.
 */
async function consoleSouthWoodScan16Ahead(
  bot: Bot,
  label: string,
  rowNum: number,
  rowX: number,
  rowZ: number,
  signal?: AbortSignal
): Promise<void> {
  throwIfAborted(signal);
  const feet = bot.entity.position.floored();
  const lookTarget = feet.offset(0, 1, 8).offset(0.5, 0.5, 0.5);
  try {
    await bot.lookAt(lookTarget, true);
  } catch (e) {
    error(
      "%s %d (%d, %d): look south failed: %s",
      label,
      rowNum,
      rowX,
      rowZ,
      (e as Error).message
    );
  }
  throwIfAborted(signal);

  const bx = feet.x;
  const by = feet.y;
  const bz = feet.z;
  const minX = bx - WOOD_SCAN_HALF;
  const maxX = minX + WOOD_SCAN_SIZE;
  const minY = by - WOOD_SCAN_HALF;
  const maxY = minY + WOOD_SCAN_SIZE;
  const minZ = bz + WOOD_SCAN_Z0;
  const maxZ = minZ + WOOD_SCAN_SIZE;

  const matches: { name: string; x: number; y: number; z: number }[] = [];
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      for (let z = minZ; z < maxZ; z++) {
        throwIfAborted(signal);
        const b = bot.blockAt(feet.offset(x - bx, y - by, z - bz));
        if (!b || b.name === "air" || b.name === "cave_air" || b.name === "void_air") continue;
        if (!isConsoleWoodAllowlist(b.name)) continue;
        matches.push({ name: b.name, x, y, z });
      }
    }
  }

  const counts = new Map<string, number>();
  for (const m of matches) {
    counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
  }
  const countStr = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([n, c]) => `${n}=${c}`)
    .join(", ");

  log(
    "%s %d (%d, %d): south wood scan 16³ [%d..%d × %d..%d × %d..%d] → %d block(s)%s",
    label,
    rowNum,
    rowX,
    rowZ,
    minX,
    maxX - 1,
    minY,
    maxY - 1,
    minZ,
    maxZ - 1,
    matches.length,
    countStr ? ` (${countStr})` : ""
  );
}

export interface VillageRecorderProgress {
  current: number;
  total: number;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Recorder stopped by user");
  }
}

function combineAbortSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a) return b;
  if (!b) return a;
  const c = new AbortController();
  const forward = (): void => {
    c.abort();
  };
  if (a.aborted || b.aborted) {
    c.abort();
    return c.signal;
  }
  a.addEventListener("abort", forward, { once: true });
  b.addEventListener("abort", forward, { once: true });
  return c.signal;
}

async function sleepAbortable(ms: number, signal?: AbortSignal): Promise<void> {
  const stepMs = 100;
  let remaining = ms;
  while (remaining > 0) {
    throwIfAborted(signal);
    const waitFor = Math.min(stepMs, remaining);
    await sleep(waitFor);
    remaining -= waitFor;
  }
}

/** Wait until vertical motion settles after a high TP (same logic as original recorder loop). */
async function waitUntilStable(
  bot: Bot,
  tpY: number,
  groundTimeoutMs: number,
  signal?: AbortSignal
): Promise<boolean> {
  const deadline = Date.now() + groundTimeoutMs;
  let lastY = bot.entity.position.y;
  let stableTicks = 0;
  const requiredStable = 2;

  while (Date.now() < deadline) {
    await sleepAbortable(TP_CHECK_MS, signal);
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
      if (stableTicks >= requiredStable) return true;
    } else {
      stableTicks = 0;
    }
    lastY = pos.y;
  }
  return false;
}

function isChestUnderFeet(block: { name: string } | null): boolean {
  if (!block) return false;
  return block.name === "chest" || block.name === "trapped_chest";
}

/**
 * When standing on an exposed chest, feet Y can floor to the chest's block Y, so
 * blockAt(floored).offset(0,-1) reads the void below the chest (air). Check the
 * feet voxel and the block under it for chest.
 */
function isStandingOnChest(bot: Bot): boolean {
  const pos = bot.entity.position.floored();
  const atFeet = bot.blockAt(pos);
  const belowFeet = bot.blockAt(pos.offset(0, -1, 0));
  return isChestUnderFeet(atFeet) || isChestUnderFeet(belowFeet);
}

/** mineflayer may allow dig on fluids; `bot.dig` then never completes until stopDigging — avoid that hang. */
function isFluidBlockName(name: string): boolean {
  return (
    name === "water" ||
    name === "flowing_water" ||
    name === "lava" ||
    name === "flowing_lava" ||
    name === "bubble_column"
  );
}

/** True if any block in the column under the feet (same X,Z, increasing depth) is a chest. */
function hasChestInColumnBelowFeet(bot: Bot, maxDown: number): boolean {
  const pos = bot.entity.position.floored();
  for (let dy = 1; dy <= maxDown; dy++) {
    const b = bot.blockAt(pos.offset(0, -dy, 0));
    if (!b) return false;
    if (isChestUnderFeet(b)) return true;
    if (b.name === "bedrock") return false;
  }
  return false;
}

async function digUntilChestBelowFeet(
  bot: Bot,
  config: VillageRecorderConfig,
  label: string,
  rowNum: number,
  x: number,
  z: number,
  signal?: AbortSignal
): Promise<void> {
  const maxSteps = config.maxDigSteps ?? 32;
  const tpY = config.tpY;
  const timeoutMs = config.groundTimeoutMs;

  for (let step = 0; step < maxSteps; step++) {
    throwIfAborted(signal);
    const stable = await waitUntilStable(bot, tpY, timeoutMs, signal);
    if (!stable) {
      error(
        "Timeout waiting for stable ground before dig at %s %d (%d, %d)",
        label,
        rowNum,
        x,
        z
      );
      return;
    }

    const pos = bot.entity.position.floored();
    if (isStandingOnChest(bot)) {
      log(
        "%s %d (%d, %d): chest under feet after %d dig step(s)",
        label,
        rowNum,
        x,
        z,
        step
      );
      return;
    }

    const blockBelow = bot.blockAt(pos.offset(0, -1, 0));
    if (!blockBelow) {
      error("No block below feet at %s %d (%d, %d)", label, rowNum, x, z);
      return;
    }

    const airLike =
      blockBelow.name === "air" ||
      blockBelow.name === "cave_air" ||
      blockBelow.name === "void_air";
    if (airLike) {
      error(
        "Air under feet at %s %d (%d, %d); cannot dig to chest",
        label,
        rowNum,
        x,
        z
      );
      return;
    }

    if (isFluidBlockName(blockBelow.name)) {
      if (hasChestInColumnBelowFeet(bot, CHEST_COLUMN_SCAN_BLOCKS)) {
        log(
          "%s %d (%d, %d): chest found in column below (through fluid) after %d dig step(s)",
          label,
          rowNum,
          x,
          z,
          step
        );
        return;
      }
      error(
        "Fluid (%s) under feet at %s %d (%d, %d); no chest within %d blocks below in column",
        blockBelow.name,
        label,
        rowNum,
        x,
        z,
        CHEST_COLUMN_SCAN_BLOCKS
      );
      return;
    }

    if (!bot.canDigBlock(blockBelow)) {
      error(
        "Cannot dig block under feet (%s) at %s %d (%d, %d)",
        blockBelow.name,
        label,
        rowNum,
        x,
        z
      );
      return;
    }

    try {
      await bot.dig(blockBelow);
    } catch (e) {
      error(
        "Dig failed at %s %d (%d, %d): %s",
        label,
        rowNum,
        x,
        z,
        (e as Error).message
      );
      return;
    }
  }

  error(
    "Max dig steps (%d) reached at %s %d (%d, %d) without chest under feet",
    maxSteps,
    label,
    rowNum,
    x,
    z
  );
}

export async function runVillageRecorder(
  bot: Bot,
  config: VillageRecorderConfig,
  options?: { onProgress?: (progress: VillageRecorderProgress) => void; signal?: AbortSignal }
): Promise<void> {
  throwIfAborted(options?.signal);
  const label = config.logLabel ?? "Village";
  const parsed = parseVillagesCsv(config.csvPath);
  if (parsed.rows.length === 0) {
    log("No rows to process (%s)", label);
    writeOutput(parsed, [], config.outputPath);
    return;
  }

  log("Switching to survival with Resistance (invincible) so bot falls to ground...");
  bot.chat("/effect give @s resistance 1000000 255 true");
  bot.chat("/gamemode survival");
  await sleepAbortable(MODE_SWITCH_DELAY_MS, options?.signal);

  try {
    const results: { row: Record<string, string>; y: number }[] = [];
    const xKey = parsed.header.find((h) => h.toLowerCase() === "x") ?? "x";
    const zKey = parsed.header.find((h) => h.toLowerCase() === "z") ?? "z";

    for (let i = 0; i < parsed.rows.length; i++) {
      throwIfAborted(options?.signal);
      const row = parsed.rows[i];
      const x = parseInt(row[xKey], 10);
      const z = parseInt(row[zKey], 10);

      try {
        bot.chat(`/tp @s ${x} ${config.tpY} ${z}`);
      } catch (e) {
        error("TP failed for %s %d (%d, %d): %s", label, i + 1, x, z, (e as Error).message);
        continue;
      }

      await sleepAbortable(config.delayAfterTpMs, options?.signal);

      const rowTimeout = new AbortController();
      const rowTimer = setTimeout(() => {
        rowTimeout.abort();
        bot.stopDigging?.();
      }, ROW_ATTEMPT_TIMEOUT_MS);
      const rowSignal = combineAbortSignals(options?.signal, rowTimeout.signal);

      try {
        if (config.waitForGround) {
          const stable = await waitUntilStable(
            bot,
            config.tpY,
            config.groundTimeoutMs,
            rowSignal
          );
          if (!stable) {
            error(
              "Timeout waiting for ground at %s %d (%d, %d), using current Y",
              label,
              i + 1,
              x,
              z
            );
          }
        }

        if (config.consoleSouthWoodScan16) {
          await consoleSouthWoodScan16Ahead(bot, label, i + 1, x, z, rowSignal);
        }

        if (config.digUntilChestBelowFeet) {
          await digUntilChestBelowFeet(
            bot,
            config,
            label,
            i + 1,
            x,
            z,
            rowSignal
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "Recorder stopped by user") {
          if (options?.signal?.aborted) throw e;
          if (rowTimeout.signal.aborted) {
            error(
              "Row attempt exceeded %dms at %s %d (%d, %d), using current Y",
              ROW_ATTEMPT_TIMEOUT_MS,
              label,
              i + 1,
              x,
              z
            );
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      } finally {
        clearTimeout(rowTimer);
        bot.stopDigging?.();
      }

      const y = bot.entity.position.y;
      results.push({ row, y });
      const current = i + 1;
      const total = parsed.rows.length;
      options?.onProgress?.({ current, total });
      log("%s %d/%d: %d, %d → y=%d", label, current, total, x, z, Math.floor(y));
    }

    writeOutput(parsed, results, config.outputPath);
  } finally {
    log("Restoring creative and clearing effects.");
    bot.chat("/gamemode creative");
    bot.chat("/effect clear @s");
  }
}
