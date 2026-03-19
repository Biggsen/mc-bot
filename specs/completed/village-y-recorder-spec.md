# Village Y-Coordinate Recorder Spec

**Status: Completed**

---

## Purpose

Automate recording the ground-level Y coordinate for each village in a CSV file. The bot teleports itself to each village (x, z), reads its position after arriving (and optionally after landing), and writes the Y values to an output file. No manual noting down—run once, get a complete list.

**Prerequisites:**
- The bot must be op (or have permission to run `/tp`) so it can teleport itself.
- The bot is switched to survival with Resistance (invincible) during the run so it falls to ground; creative is restored when done.

---

## Scope

- **Input:** A CSV file with at least columns for village x and z (e.g. the structure from Chunk Base or similar: seed, structure, x, z, details).
- **Output:** A file (new or updated) containing the same village rows plus a Y column (e.g. `x,z,y` or the full row with `y` added).
- **Behaviour:** Script or command that: load CSV → for each village TP bot to (x, z) → wait for ground → read `bot.entity.position.y` → record → write results.

Out of scope for this spec: pathfinding to villages, discovering villages, or any movement other than TP.

---

## Flow

1. Bot connects and spawns.
2. Runner loads the villages CSV from a configured path.
3. Bot is switched to survival and given Resistance (invincible); short delay for mode/effect to apply.
4. For each village row (x, z):
   - Bot runs `/tp @s <x> <tpY> <z>` (tpY configurable, default 200).
   - Wait until the bot has dropped below TP height and is on ground (stability or time-based fallback).
   - Read `bot.entity.position.y` (actual spawn Y is used when server overrides TP height).
   - Store (x, z, y) or full row + y.
5. Write all results to the output file (CSV with y column).
6. Restore creative and clear effects.
7. Log progress (e.g. “Village 3/50: x, z → y”).

---

## Functional Requirements

### FR1: Input CSV format
- Parser must support the actual format in use (semicolon-separated, header row, optional comment lines).
- Required columns: at least `x` and `z` (or equivalent names). Other columns (seed, structure, details) should be preserved in the output if present.

### FR2: Teleport
- Bot sends a teleport command for itself, e.g. `bot.chat(\`/tp @s ${x} ${tpY} ${z}\`)`.
- TP height (tpY) must be configurable (env); default 200. If the server places the bot at a different Y, that actual Y is used for “wait for ground” logic and a log message is emitted.

### FR3: Position sampling
- After each TP, wait for the bot to be below the TP height and for vertical movement to settle (velocity/position stability or minimum time below TP), then record Y from `bot.entity.position.y` (floored to integer).

### FR4: Output
- Write results to a configured path (env or option).
- Output must include at least: x, z, y. Mirror the input structure and add a `y` column.

### FR5: Configuration
- CSV input path (required).
- Output path (required).
- Optional: TP height, delay after TP before sampling, wait for “on ground”, ground timeout.

### FR6: Invocation
- Triggered by the chat command `startvillages`. Bot must already be connected and op. Set `VILLAGE_CSV_PATH` and `VILLAGE_OUTPUT_PATH` in `.env` to enable; if unset, the bot replies that the recorder is not configured. Only one run at a time; a second `startvillages` while a run is in progress is rejected.

---

## Non-Functional Requirements

### NFR1: No manual steps
Once started, the process must run to completion (or fail clearly) and produce the output file without requiring the user to write down or copy values.

### NFR2: Clear logging
Log progress (current village index, x, z, sampled y) and any failures (TP failed, timeout waiting for ground). Log when the server places the bot at a different Y than requested.

### NFR3: Minimal scope
Do not add pathfinding, web UIs, or databases. Keep the feature focused: load CSV → TP → read Y → write file.

---

## Edge Cases / Notes

- **Encoding:** UTF-8; preserve semicolon separator if that’s what the input uses.
- **Header / comments:** Preserve or replicate header and comment lines in the output (e.g. `Sep=;`, `#...`).
- **TP failure:** If the server rejects the TP, log and skip that village; do not hang indefinitely.
- **Server overrides Y:** If the server places the bot at a different Y than requested, use that actual Y for “dropped” and “on ground” logic; log the mismatch.
- **Resume:** Optional: support skipping villages that already have a Y in the output file (idempotent run). Not implemented in v1.

---

## Implementation Notes (as built)

- **CSV:** `src/features/villageRecorder/parseCsv.ts` — fs + simple parser; supports `Sep=;`, comment lines, x/z columns (case-insensitive), invalid rows skipped with log.
- **Recorder:** `src/features/villageRecorder/runRecorder.ts` — survival + Resistance at start; TP; wait for ground (must be ≥5 blocks below TP height, then either 3 stable ticks or 2s below); use actual spawn Y when server overrides; write output; restore creative + clear effects.
- **Config:** `VILLAGE_CSV_PATH`, `VILLAGE_OUTPUT_PATH`, `VILLAGE_TP_Y` (default 200), `VILLAGE_DELAY_AFTER_TP_MS`, `VILLAGE_WAIT_FOR_GROUND`, `VILLAGE_GROUND_TIMEOUT_MS` in `.env`.
- **Trigger:** Chat command `startvillages` in `src/commands/chatCommands.ts`; single run at a time.

---

## Success Criteria

- Operator places the villages CSV path (and output path) in config.
- Operator makes the bot op and starts the bot (and the recorder).
- The bot teleports to each village, and the output file is written with a Y value for each row.
- No manual copying of coordinates is required.
