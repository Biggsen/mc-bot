import type { Bot } from "mineflayer";
import type { BotConfig } from "../config/env.js";
import { log, error } from "../utils/logger.js";
import { attachChatCommands } from "../commands/chatCommands.js";

export interface AttachEventsOptions {
  onEnd?: () => void;
}

export function attachEvents(
  bot: Bot,
  config: BotConfig,
  options: AttachEventsOptions = {}
): void {
  attachChatCommands(bot);

  bot.on("spawn", async () => {
    log("Spawned in world");
    if (config.gamemodeOnSpawn) {
      bot.chat(`/gamemode ${config.gamemodeOnSpawn}`);
    }
    if (config.chatOnSpawn) {
      bot.chat(config.chatOnSpawn);
    }
    if (config.viewerPort) {
      const pv = (await import("prismarine-viewer")) as {
        default: { mineflayer: (b: Bot, o: { port: number }) => void };
      };
      pv.default.mineflayer(bot, { port: config.viewerPort });
      log("Viewer running at http://localhost:%d", config.viewerPort);
    }
  });

  bot.on("chat", (_username, message) => {
    log("Chat: %s", message);
  });

  bot.on("kicked", (reason) => {
    error("Kicked: %s", reason);
  });

  bot.on("error", (err) => {
    error("Error: %s", err.message);
  });

  bot.on("end", (reason) => {
    log("Disconnected: %s", reason ?? "unknown");
    if (config.reconnect && options.onEnd) {
      log("Reconnecting in %d ms...", config.reconnectDelayMs);
      setTimeout(options.onEnd, config.reconnectDelayMs);
    }
  });
}
