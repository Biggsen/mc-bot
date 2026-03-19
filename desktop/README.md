# MC-Bot Desktop App

Electron desktop app for managing server projects, CSV datasets, and running the Village Y recorder without editing `.env`.

## Prerequisites

1. Build the mc-bot package first (from repo root):
   ```bash
   npm run build
   ```
2. Install desktop dependencies:
   ```bash
   cd desktop && npm install
   ```

## Run

- **Production (built UI):** `npm run build` then `npm run electron`
- **Development (Vite dev server + hot reload):** `npm run electron:dev` (starts Vite and Electron with live reload)

## Usage

1. Create a project and set its connection (host, port, bot username).
2. Add an input CSV (villages) via “Add CSV…”.
3. Choose that input and click “Run Village Y recorder”. Progress appears as “Village 12/46”.
4. When done, the output CSV appears under Output datasets; use View or “Show in folder” to retrieve it.

Data is stored under your system app data (e.g. `%APPDATA%/mc-bot-desktop/mc-bot-app` on Windows).
