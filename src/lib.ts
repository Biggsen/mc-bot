export { createBot } from "./bot/createBot.js";
export { attachEvents, type AttachEventsOptions } from "./bot/attachEvents.js";
export {
  runVillageRecorder,
  type VillageRecorderProgress,
} from "./features/villageRecorder/index.js";
export {
  loadConfig,
  buildBotConfigFromConnection,
  type BotConfig,
  type VillageRecorderConfig,
  type ConnectionOptions,
} from "./config/env.js";
