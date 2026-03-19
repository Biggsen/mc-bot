export interface VillageRecorderConfig {
  csvPath: string;
  outputPath: string;
  tpY: number;
  delayAfterTpMs: number;
  waitForGround: boolean;
  groundTimeoutMs: number;
}

export interface BotConfig {
  host: string;
  port: number;
  username: string;
  version: string | undefined;
  auth: string;
  chatOnSpawn: string | undefined;
  gamemodeOnSpawn: "creative" | "survival" | "adventure" | "spectator" | undefined;
  viewerPort: number | undefined;
  reconnect: boolean;
  reconnectDelayMs: number;
  villageRecorder: VillageRecorderConfig | undefined;
  junglePyramidsRecorder: VillageRecorderConfig | undefined;
}

export interface ConnectionOptions {
  host: string;
  port: number;
  username: string;
  version?: string;
}

export function buildBotConfigFromConnection(
  connection: ConnectionOptions
): BotConfig {
  return {
    host: connection.host,
    port: connection.port,
    username: connection.username,
    version: connection.version,
    auth: "offline",
    chatOnSpawn: undefined,
    gamemodeOnSpawn: "creative",
    viewerPort: undefined,
    reconnect: false,
    reconnectDelayMs: 5000,
    villageRecorder: undefined,
    junglePyramidsRecorder: undefined,
  };
}

const REQUIRED = ["MC_HOST", "MC_PORT", "MC_USERNAME", "MC_AUTH"] as const;

export function loadConfig(): BotConfig {
  const port = process.env.MC_PORT;
  const portNum = port ? parseInt(port, 10) : NaN;
  if (!port || Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error(
      "Invalid or missing MC_PORT. Set MC_PORT to a number between 1 and 65535 (e.g. 25565)."
    );
  }

  for (const key of REQUIRED) {
    if (!process.env[key]?.trim()) {
      throw new Error(
        `Missing required env: ${key}. Copy .env.example to .env and set all required values.`
      );
    }
  }

  const version = process.env.MC_VERSION?.trim();
  const chatOnSpawn = process.env.BOT_CHAT_ON_SPAWN?.trim();
  const gamemodeRaw = process.env.BOT_GAMEMODE_ON_SPAWN?.trim()?.toLowerCase();
  const gamemodeOnSpawn =
    gamemodeRaw === "creative" ||
    gamemodeRaw === "survival" ||
    gamemodeRaw === "adventure" ||
    gamemodeRaw === "spectator"
      ? gamemodeRaw
      : undefined;
  const viewerPortRaw = process.env.BOT_VIEWER_PORT?.trim();
  const viewerPort = viewerPortRaw ? parseInt(viewerPortRaw, 10) : NaN;
  const viewerPortValid =
    !Number.isNaN(viewerPort) && viewerPort > 0 && viewerPort <= 65535;
  const reconnect = process.env.BOT_RECONNECT?.toLowerCase() === "true";
  const reconnectDelayMs = parseInt(
    process.env.BOT_RECONNECT_DELAY_MS ?? "5000",
    10
  );

  const villageCsvPath = process.env.VILLAGE_CSV_PATH?.trim();
  const villageOutputPath = process.env.VILLAGE_OUTPUT_PATH?.trim();
  let villageRecorder: VillageRecorderConfig | undefined;
  if (villageCsvPath && villageOutputPath) {
    const tpY = parseInt(process.env.VILLAGE_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.VILLAGE_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.VILLAGE_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.VILLAGE_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    villageRecorder = {
      csvPath: villageCsvPath,
      outputPath: villageOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
    };
  }

  const jungleCsvPath = process.env.JUNGLE_PYRAMIDS_CSV_PATH?.trim();
  const jungleOutputPath = process.env.JUNGLE_PYRAMIDS_OUTPUT_PATH?.trim();
  let junglePyramidsRecorder: VillageRecorderConfig | undefined;
  if (jungleCsvPath && jungleOutputPath) {
    const tpY = parseInt(process.env.JUNGLE_PYRAMIDS_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.JUNGLE_PYRAMIDS_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.JUNGLE_PYRAMIDS_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.JUNGLE_PYRAMIDS_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    junglePyramidsRecorder = {
      csvPath: jungleCsvPath,
      outputPath: jungleOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
    };
  }

  return {
    host: process.env.MC_HOST!.trim(),
    port: portNum,
    username: process.env.MC_USERNAME!.trim(),
    version: version === "" ? undefined : version,
    auth: process.env.MC_AUTH!.trim().toLowerCase(),
    chatOnSpawn: chatOnSpawn === "" ? undefined : chatOnSpawn,
    gamemodeOnSpawn,
    viewerPort: viewerPortValid ? viewerPort : undefined,
    reconnect,
    reconnectDelayMs: Number.isNaN(reconnectDelayMs) ? 5000 : reconnectDelayMs,
    villageRecorder,
    junglePyramidsRecorder,
  };
}
