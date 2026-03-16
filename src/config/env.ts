export interface BotConfig {
  host: string;
  port: number;
  username: string;
  version: string | undefined;
  auth: string;
  chatOnSpawn: string | undefined;
  reconnect: boolean;
  reconnectDelayMs: number;
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
  const reconnect = process.env.BOT_RECONNECT?.toLowerCase() === "true";
  const reconnectDelayMs = parseInt(
    process.env.BOT_RECONNECT_DELAY_MS ?? "5000",
    10
  );

  return {
    host: process.env.MC_HOST!.trim(),
    port: portNum,
    username: process.env.MC_USERNAME!.trim(),
    version: version === "" ? undefined : version,
    auth: process.env.MC_AUTH!.trim().toLowerCase(),
    chatOnSpawn: chatOnSpawn === "" ? undefined : chatOnSpawn,
    reconnect,
    reconnectDelayMs: Number.isNaN(reconnectDelayMs) ? 5000 : reconnectDelayMs,
  };
}
