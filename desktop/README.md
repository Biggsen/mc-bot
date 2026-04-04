# MC-Bot Desktop App

Electron app for server projects, CSV datasets, and structure Y recorders.

## From repo root (recommended)

```bash
cd ..   # repo root
npm install
npm run build
npm run electron:dev
```

Root `package.json` defines `electron:dev` and other Electron scripts so you do not need to `cd desktop` for day-to-day use.

## From this folder only

```bash
npm install
cd .. && npm run build && cd desktop
npm run electron:dev
```

## Usage

1. Create a project and set connection (host, port, bot username).
2. Add input CSVs by structure type.
3. Run the matching recorder; progress shows in the UI.
4. Output CSVs appear under output datasets (view or open folder).
