import mineflayer from "mineflayer";
import type { BotConfig } from "../config/env.js";

export function createBot(config: BotConfig) {
  const options: { host: string; port: number; username: string; version?: string } = {
    host: config.host,
    port: config.port,
    username: config.username,
  };
  if (config.version) {
    options.version = config.version;
  }
  return mineflayer.createBot(options);
}
