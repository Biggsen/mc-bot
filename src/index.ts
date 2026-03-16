import "dotenv/config";
import { loadConfig } from "./config/env.js";
import { createBot } from "./bot/createBot.js";
import { attachEvents } from "./bot/attachEvents.js";
import { log } from "./utils/logger.js";

function run(): void {
  log("Starting...");
  const config = loadConfig();
  const bot = createBot(config);
  attachEvents(bot, config, {
    onEnd: () => {
      if (config.reconnect) {
        setTimeout(run, config.reconnectDelayMs);
      }
    },
  });
}

run();
