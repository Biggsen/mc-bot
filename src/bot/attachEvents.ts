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

  bot.on("spawn", () => {
    log("Spawned in world");
    if (config.chatOnSpawn) {
      bot.chat(config.chatOnSpawn);
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
