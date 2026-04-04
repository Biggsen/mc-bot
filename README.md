# MC-Bot

Desktop app (Electron) for Minecraft server projects, structure CSVs, and running **Y recorders** (villages, mansions, etc.) without hand-editing `.env`. The Mineflayer bot logic lives in `src/` and is loaded by the app as the **`mc-bot` library** (`mc-bot/lib`).

## Prerequisites

- **Node.js** (v18+)
- A running **Minecraft Java Edition** server when you use recorders or connect the bot

## Setup (from repo root)

```bash
npm install
npm run build
```

`npm run build` compiles the TypeScript library under `dist/` (required for the desktop app to import `mc-bot/lib`).

## Run the desktop app

```bash
npm run electron:dev
```

Starts Vite + Electron with hot reload. No need to `cd desktop`.

**Other scripts**

| Command | Purpose |
|--------|---------|
| `npm run dev` | TypeScript watch for `src/` (library); use alongside `electron:dev` while editing bot code |
| `npm run electron:build` | Compile `src/` (`tsc`) then build the Electron renderer (Vite) |
| `npm run electron:pack` / `electron:dist` | Same as above, then package with electron-builder |

App data (projects, datasets) lives under system app data, e.g. `%APPDATA%/mc-bot-desktop/mc-bot-app` on Windows.

## Library only

This repo is an npm workspace: root is **`mc-bot`** (the bot library), **`desktop/`** is **`mc-bot-desktop`**. Other tools can depend on `mc-bot` and `import` from `mc-bot/lib` (`createBot`, `runVillageRecorder`, etc.) after `npm run build`.

## Common problems

| Issue | What to check |
|--------|----------------|
| **Electron fails to load bot code** | Run `npm run build` at the repo root so `dist/lib.js` exists. |
| **Cannot connect** | In the app, set project connection host/port correctly. For a server in Docker from the host, use published port and `localhost`. |
| **Version kick** | Set the Minecraft version on the project connection if auto-detect fails. |

## Project structure

- `src/` — Mineflayer bot, config, recorders, chat commands (compiled to `dist/`)
- `desktop/` — Electron + React UI (`npm run electron:dev` from root)
