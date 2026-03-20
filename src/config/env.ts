export interface VillageRecorderConfig {
  csvPath: string;
  outputPath: string;
  tpY: number;
  delayAfterTpMs: number;
  waitForGround: boolean;
  groundTimeoutMs: number;
  /** Console log prefix, e.g. "Village", "Desert well". Default "Village". */
  logLabel?: string;
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
  desertWellsRecorder: VillageRecorderConfig | undefined;
  desertPyramidsRecorder: VillageRecorderConfig | undefined;
  pillagerOutpostsRecorder: VillageRecorderConfig | undefined;
  igloosRecorder: VillageRecorderConfig | undefined;
  trailRuinsRecorder: VillageRecorderConfig | undefined;
  buriedTreasureRecorder: VillageRecorderConfig | undefined;
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
    desertWellsRecorder: undefined,
    desertPyramidsRecorder: undefined,
    pillagerOutpostsRecorder: undefined,
    igloosRecorder: undefined,
    trailRuinsRecorder: undefined,
    buriedTreasureRecorder: undefined,
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
      logLabel: "Jungle pyramid",
    };
  }

  const desertWellsCsvPath = process.env.DESERT_WELLS_CSV_PATH?.trim();
  const desertWellsOutputPath = process.env.DESERT_WELLS_OUTPUT_PATH?.trim();
  let desertWellsRecorder: VillageRecorderConfig | undefined;
  if (desertWellsCsvPath && desertWellsOutputPath) {
    const tpY = parseInt(process.env.DESERT_WELLS_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.DESERT_WELLS_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.DESERT_WELLS_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.DESERT_WELLS_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    desertWellsRecorder = {
      csvPath: desertWellsCsvPath,
      outputPath: desertWellsOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
      logLabel: "Desert well",
    };
  }

  const desertPyramidsCsvPath = process.env.DESERT_PYRAMIDS_CSV_PATH?.trim();
  const desertPyramidsOutputPath = process.env.DESERT_PYRAMIDS_OUTPUT_PATH?.trim();
  let desertPyramidsRecorder: VillageRecorderConfig | undefined;
  if (desertPyramidsCsvPath && desertPyramidsOutputPath) {
    const tpY = parseInt(process.env.DESERT_PYRAMIDS_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.DESERT_PYRAMIDS_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.DESERT_PYRAMIDS_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.DESERT_PYRAMIDS_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    desertPyramidsRecorder = {
      csvPath: desertPyramidsCsvPath,
      outputPath: desertPyramidsOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
      logLabel: "Desert pyramid",
    };
  }

  const pillagerOutpostsCsvPath = process.env.PILLAGER_OUTPOSTS_CSV_PATH?.trim();
  const pillagerOutpostsOutputPath = process.env.PILLAGER_OUTPOSTS_OUTPUT_PATH?.trim();
  let pillagerOutpostsRecorder: VillageRecorderConfig | undefined;
  if (pillagerOutpostsCsvPath && pillagerOutpostsOutputPath) {
    const tpY = parseInt(process.env.PILLAGER_OUTPOSTS_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.PILLAGER_OUTPOSTS_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.PILLAGER_OUTPOSTS_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.PILLAGER_OUTPOSTS_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    pillagerOutpostsRecorder = {
      csvPath: pillagerOutpostsCsvPath,
      outputPath: pillagerOutpostsOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
      logLabel: "Pillager outpost",
    };
  }

  const igloosCsvPath = process.env.IGLOOS_CSV_PATH?.trim();
  const igloosOutputPath = process.env.IGLOOS_OUTPUT_PATH?.trim();
  let igloosRecorder: VillageRecorderConfig | undefined;
  if (igloosCsvPath && igloosOutputPath) {
    const tpY = parseInt(process.env.IGLOOS_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.IGLOOS_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.IGLOOS_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.IGLOOS_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    igloosRecorder = {
      csvPath: igloosCsvPath,
      outputPath: igloosOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
      logLabel: "Igloo",
    };
  }

  const trailRuinsCsvPath = process.env.TRAIL_RUINS_CSV_PATH?.trim();
  const trailRuinsOutputPath = process.env.TRAIL_RUINS_OUTPUT_PATH?.trim();
  let trailRuinsRecorder: VillageRecorderConfig | undefined;
  if (trailRuinsCsvPath && trailRuinsOutputPath) {
    const tpY = parseInt(process.env.TRAIL_RUINS_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.TRAIL_RUINS_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.TRAIL_RUINS_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.TRAIL_RUINS_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    trailRuinsRecorder = {
      csvPath: trailRuinsCsvPath,
      outputPath: trailRuinsOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
      logLabel: "Trail ruins",
    };
  }

  const buriedTreasureCsvPath = process.env.BURIED_TREASURE_CSV_PATH?.trim();
  const buriedTreasureOutputPath = process.env.BURIED_TREASURE_OUTPUT_PATH?.trim();
  let buriedTreasureRecorder: VillageRecorderConfig | undefined;
  if (buriedTreasureCsvPath && buriedTreasureOutputPath) {
    const tpY = parseInt(process.env.BURIED_TREASURE_TP_Y ?? "320", 10);
    const delayAfterTpMs = parseInt(
      process.env.BURIED_TREASURE_DELAY_AFTER_TP_MS ?? "500",
      10
    );
    const waitForGround =
      process.env.BURIED_TREASURE_WAIT_FOR_GROUND?.toLowerCase() !== "false";
    const groundTimeoutMs = parseInt(
      process.env.BURIED_TREASURE_GROUND_TIMEOUT_MS ?? "15000",
      10
    );
    buriedTreasureRecorder = {
      csvPath: buriedTreasureCsvPath,
      outputPath: buriedTreasureOutputPath,
      tpY: Number.isNaN(tpY) ? 320 : tpY,
      delayAfterTpMs: Number.isNaN(delayAfterTpMs) ? 500 : delayAfterTpMs,
      waitForGround,
      groundTimeoutMs: Number.isNaN(groundTimeoutMs) ? 15000 : groundTimeoutMs,
      logLabel: "Buried treasure",
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
    desertWellsRecorder,
    desertPyramidsRecorder,
    pillagerOutpostsRecorder,
    igloosRecorder,
    trailRuinsRecorder,
    buriedTreasureRecorder,
  };
}
