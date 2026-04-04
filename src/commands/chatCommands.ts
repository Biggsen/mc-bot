import type { Bot } from "mineflayer";
import type { BotConfig } from "../config/env.js";
import { runVillageRecorder } from "../features/villageRecorder/index.js";
import { log } from "../utils/logger.js";

const MAX_CHAT_LENGTH = 256;

let villageRecorderRunning = false;
let junglePyramidsRecorderRunning = false;
let desertWellsRecorderRunning = false;
let desertPyramidsRecorderRunning = false;
let pillagerOutpostsRecorderRunning = false;
let igloosRecorderRunning = false;
let trailRuinsRecorderRunning = false;
let woodlandMansionsRecorderRunning = false;
let buriedTreasureRecorderRunning = false;

function sendLong(bot: Bot, text: string): void {
  if (text.length <= MAX_CHAT_LENGTH) {
    bot.chat(text);
    return;
  }
  const chunks = text.split(", ");
  let buf = "";
  for (const c of chunks) {
    if (buf.length + c.length + 2 > MAX_CHAT_LENGTH) {
      if (buf) bot.chat(buf.trimEnd().replace(/,\s*$/, ""));
      buf = c;
    } else {
      buf += (buf ? ", " : "") + c;
    }
  }
  if (buf) bot.chat(buf.trimEnd().replace(/,\s*$/, ""));
}

export function attachChatCommands(bot: Bot, config: BotConfig): void {
  bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    const trimmed = message.trim().toLowerCase();

    if (trimmed === "startvillages") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.villageRecorder) {
        bot.chat(
          "Village recorder not configured. Set VILLAGE_CSV_PATH and VILLAGE_OUTPUT_PATH in .env"
        );
        return;
      }
      villageRecorderRunning = true;
      bot.chat("Starting village Y recorder...");
      runVillageRecorder(bot, config.villageRecorder)
        .then(() => {
          bot.chat("Village recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Village recorder error: %s", (err as Error).message);
          bot.chat("Village recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          villageRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "startjunglepyramids") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.junglePyramidsRecorder) {
        bot.chat(
          "Jungle pyramids recorder not configured. Set JUNGLE_PYRAMIDS_CSV_PATH and JUNGLE_PYRAMIDS_OUTPUT_PATH in .env"
        );
        return;
      }
      junglePyramidsRecorderRunning = true;
      bot.chat("Starting jungle pyramids Y recorder...");
      runVillageRecorder(bot, config.junglePyramidsRecorder)
        .then(() => {
          bot.chat("Jungle pyramids recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Jungle pyramids recorder error: %s", (err as Error).message);
          bot.chat("Jungle pyramids recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          junglePyramidsRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "startdesertwells") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.desertWellsRecorder) {
        bot.chat(
          "Desert wells recorder not configured. Set DESERT_WELLS_CSV_PATH and DESERT_WELLS_OUTPUT_PATH in .env"
        );
        return;
      }
      desertWellsRecorderRunning = true;
      bot.chat("Starting desert wells Y recorder...");
      runVillageRecorder(bot, config.desertWellsRecorder)
        .then(() => {
          bot.chat("Desert wells recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Desert wells recorder error: %s", (err as Error).message);
          bot.chat("Desert wells recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          desertWellsRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "startdesertpyramids") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.desertPyramidsRecorder) {
        bot.chat(
          "Desert pyramids recorder not configured. Set DESERT_PYRAMIDS_CSV_PATH and DESERT_PYRAMIDS_OUTPUT_PATH in .env"
        );
        return;
      }
      desertPyramidsRecorderRunning = true;
      bot.chat("Starting desert pyramids Y recorder...");
      runVillageRecorder(bot, config.desertPyramidsRecorder)
        .then(() => {
          bot.chat("Desert pyramids recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Desert pyramids recorder error: %s", (err as Error).message);
          bot.chat("Desert pyramids recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          desertPyramidsRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "startpillageroutposts") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.pillagerOutpostsRecorder) {
        bot.chat(
          "Pillager outposts recorder not configured. Set PILLAGER_OUTPOSTS_CSV_PATH and PILLAGER_OUTPOSTS_OUTPUT_PATH in .env"
        );
        return;
      }
      pillagerOutpostsRecorderRunning = true;
      bot.chat("Starting pillager outposts Y recorder...");
      runVillageRecorder(bot, config.pillagerOutpostsRecorder)
        .then(() => {
          bot.chat("Pillager outposts recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Pillager outposts recorder error: %s", (err as Error).message);
          bot.chat("Pillager outposts recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          pillagerOutpostsRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "startigloos") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.igloosRecorder) {
        bot.chat(
          "Igloos recorder not configured. Set IGLOOS_CSV_PATH and IGLOOS_OUTPUT_PATH in .env"
        );
        return;
      }
      igloosRecorderRunning = true;
      bot.chat("Starting igloos Y recorder...");
      runVillageRecorder(bot, config.igloosRecorder)
        .then(() => {
          bot.chat("Igloos recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Igloos recorder error: %s", (err as Error).message);
          bot.chat("Igloos recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          igloosRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "starttrailruins") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.trailRuinsRecorder) {
        bot.chat(
          "Trail ruins recorder not configured. Set TRAIL_RUINS_CSV_PATH and TRAIL_RUINS_OUTPUT_PATH in .env"
        );
        return;
      }
      trailRuinsRecorderRunning = true;
      bot.chat("Starting trail ruins Y recorder...");
      runVillageRecorder(bot, config.trailRuinsRecorder)
        .then(() => {
          bot.chat("Trail ruins recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Trail ruins recorder error: %s", (err as Error).message);
          bot.chat("Trail ruins recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          trailRuinsRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "startwoodlandmansions") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.woodlandMansionsRecorder) {
        bot.chat(
          "Woodland mansions recorder not configured. Set WOODLAND_MANSIONS_CSV_PATH and WOODLAND_MANSIONS_OUTPUT_PATH in .env"
        );
        return;
      }
      woodlandMansionsRecorderRunning = true;
      bot.chat("Starting woodland mansions Y recorder...");
      runVillageRecorder(bot, config.woodlandMansionsRecorder)
        .then(() => {
          bot.chat("Woodland mansions recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Woodland mansions recorder error: %s", (err as Error).message);
          bot.chat("Woodland mansions recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          woodlandMansionsRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "startburiedtreasure") {
      if (
        villageRecorderRunning ||
        junglePyramidsRecorderRunning ||
        desertWellsRecorderRunning ||
        desertPyramidsRecorderRunning ||
        pillagerOutpostsRecorderRunning ||
        igloosRecorderRunning ||
        trailRuinsRecorderRunning ||
        buriedTreasureRecorderRunning ||
        woodlandMansionsRecorderRunning
      ) {
        bot.chat("A recorder is already running.");
        return;
      }
      if (!config.buriedTreasureRecorder) {
        bot.chat(
          "Buried treasure recorder not configured. Set BURIED_TREASURE_CSV_PATH and BURIED_TREASURE_OUTPUT_PATH in .env"
        );
        return;
      }
      buriedTreasureRecorderRunning = true;
      bot.chat("Starting buried treasure Y recorder...");
      runVillageRecorder(bot, config.buriedTreasureRecorder)
        .then(() => {
          bot.chat("Buried treasure recorder finished. Check output file.");
        })
        .catch((err) => {
          log("Buried treasure recorder error: %s", (err as Error).message);
          bot.chat("Buried treasure recorder failed: " + (err as Error).message);
        })
        .finally(() => {
          buriedTreasureRecorderRunning = false;
        });
      return;
    }

    if (trimmed === "ping") {
      bot.chat("pong");
      return;
    }
    if (trimmed === "hello") {
      bot.chat(`Hello, ${username}!`);
      return;
    }
    if (trimmed === "where" || trimmed === "pos") {
      const p = bot.entity.position;
      bot.chat(`I'm at ${Math.floor(p.x)}, ${Math.floor(p.y)}, ${Math.floor(p.z)}`);
      return;
    }
    if (trimmed === "hp" || trimmed === "health") {
      bot.chat(`Health ${bot.health}/20, food ${bot.food}/20${bot.health === 0 ? " (dead)" : ""}`);
      return;
    }
    if (trimmed === "inv" || trimmed === "inventory") {
      const items = bot.inventory.items();
      const list = items.map((i) => `${i.name} x${i.count}`).join(", ");
      sendLong(bot, list || "Inventory empty");
      return;
    }
    if (trimmed === "held") {
      const item = bot.heldItem;
      bot.chat(item ? `${item.name} x${item.count}` : "Nothing in hand");
      return;
    }
    if (trimmed === "gm" || trimmed === "gamemode") {
      const mode = bot.game?.gameMode ?? "unknown";
      bot.chat(`Gamemode: ${mode}`);
      return;
    }
    if (trimmed === "xp" || trimmed === "experience" || trimmed === "level") {
      bot.chat(`Level ${bot.experience?.level ?? 0}, ${bot.experience?.points ?? 0} XP`);
      return;
    }
    if (trimmed === "players") {
      const names = Object.keys(bot.players).filter((n) => n !== bot.username);
      sendLong(bot, names.length ? names.join(", ") : "No other players visible");
      return;
    }
    if (trimmed === "dim" || trimmed === "dimension") {
      const dim = bot.game?.dimension ?? "unknown";
      bot.chat(`Dimension: ${dim}`);
      return;
    }
    if (trimmed === "status") {
      const p = bot.entity.position;
      const mode = bot.game?.gameMode ?? "?";
      const dim = bot.game?.dimension ?? "?";
      bot.chat(
        `At ${Math.floor(p.x)},${Math.floor(p.y)},${Math.floor(p.z)} | ${mode} | ${dim} | HP ${bot.health} Food ${bot.food}`
      );
      return;
    }
    if (trimmed === "help" || trimmed === "commands") {
      bot.chat(
        "ping, hello, where/pos, hp, inv, held, gm, xp, players, dim, status, startvillages, startjunglepyramids, startdesertwells, startdesertpyramids, startpillageroutposts, startigloos, starttrailruins, startwoodlandmansions, startburiedtreasure, help"
      );
      return;
    }
  });
}
