# mc-bot

A local development starter for Minecraft bots using [Mineflayer](https://github.com/PrismarineJS/mineflayer). Connects to Minecraft Java Edition servers (e.g. those run in Docker by an MC Server Manager) and supports basic chat commands, spawn messages, and reconnect.

## Main use cases

- Connect to local Docker Minecraft servers (e.g. from an MC Server Manager)
- Test basic bot interactions (spawn, chat, commands)
- Base for adding pathfinding, data collection, or other behaviours later

## Prerequisites

- **Node.js** (v18+)
- **Docker** (or similar) if your server runs in a container
- A running **Minecraft Java Edition** server (local or in Docker)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env and edit with your server details:

   ```bash
   cp .env.example .env
   ```

   Set at least: `MC_HOST`, `MC_PORT`, `MC_USERNAME`, `MC_AUTH`. Use `MC_VERSION` only if you need a specific version; leave blank to auto-detect.

3. Build and run:

   ```bash
   npm run build
   npm start
   ```

## Run modes

- **Bot on host** (typical with an MC Server Manager): Your Minecraft server runs in Docker and publishes a port (e.g. 25565). Run the bot on the same machine with `MC_HOST=localhost` and `MC_PORT` set to that port. The bot connects to `localhost:<port>`.

- **Bot in Docker**: If you run the bot inside a container on the same Docker network as the server, use the server’s **service/container name** as `MC_HOST` (e.g. `MC_HOST=mc`), not `localhost`. Inside a container, `localhost` is the container itself, not the Minecraft server.

## Development

```bash
npm run dev   # TypeScript watch mode; run `npm start` in another terminal to run the bot
```

## Common problems

| Problem | What to check |
|--------|----------------|
| **Cannot connect** | Server is running and port is open. If server is in Docker, the port must be published to the host (e.g. `25565:25565`). For bot on host use `MC_HOST=localhost`. |
| **Kicked immediately** | Often **version mismatch**: set `MC_VERSION` to your server’s version (e.g. `1.20.1`) or leave blank to auto-detect. |
| **Wrong host in Docker** | If the bot runs inside Docker, `MC_HOST` must be the server container/service name, not `localhost`. |
| **Auth mismatch** | For local servers use `MC_AUTH=offline`. Online/Microsoft auth is not supported in this starter. |

## Project structure

- `src/index.ts` — entrypoint: load config, create bot, attach events
- `src/config/env.ts` — load and validate environment config
- `src/bot/createBot.ts` — create Mineflayer bot from config
- `src/bot/attachEvents.ts` — wire spawn, chat, kicked, error, end
- `src/commands/chatCommands.ts` — simple in-game commands (e.g. `ping` → `pong`, `hello`, `where`)
- `src/utils/logger.ts` — console logging
