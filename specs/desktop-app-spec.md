# MC-Bot Desktop App Spec

## Purpose

A desktop application that lets you manage **server projects**, store **input and output CSVs** (villages, treasures, jungle temples, etc.), and run the bot’s recorders (e.g. Village Y recorder) without editing `.env`. The app is the place you add/upload CSVs and retrieve results when you need them.

---

## Scope

- **In scope:** Create and manage server projects; add/upload and store input CSVs by type; run recorders (starting with Village Y); store output CSVs in the app; retrieve (view, download, open) stored inputs and outputs; connect the app to the Minecraft server and drive the bot from the UI.
- **Out of scope (for v1):** Multiple recorder types beyond Village Y; web/cloud sync; multi-user or auth; full bot control panel (inventory, chat, etc.). Those may be added later.

---

## Core Concepts

### Server project

A **project** represents one Minecraft server/world. Each project has:

- **Name** (e.g. “My Survival Server”, “Test World”).
- **Connection** (optional): host, port, bot username — used when running recorders so the app knows where to connect.
- **Datasets:** the list of input and output CSVs stored for this project.

### Datasets (input and output CSVs)

- **Input CSV:** A file the user adds or uploads, tagged by **type** (e.g. villages, treasures, jungle_temples). The app stores the file (content or path under app data) and shows it in the project. Used as the source when running a recorder.
- **Output CSV:** A file produced by a recorder run. The app stores it in the project and links it to the input (and optionally to the run). The user can retrieve it later (download, open folder, copy path, or view in app).

So for each project the app stores both **input** and **output** CSVs; the user does not need to manage paths in `.env`.

### Recorder run

- User picks a project and an input dataset (e.g. “Villages”).
- User starts the relevant recorder (e.g. “Village Y recorder”). The app connects the bot (or uses an already-running bot), runs the recorder with that input, and writes the result into the project as a new **output** dataset (e.g. “Villages with Y”).
- Progress is shown (e.g. “Village 12/46”); on completion the output is stored and can be retrieved.

---

## Data Model

- **Project**
  - `id` (uuid or slug)
  - `name`
  - `connection?: { host, port, username? }`
  - `createdAt`, `updatedAt`
- **Dataset**
  - `id`
  - `projectId`
  - `type`: e.g. `villages` | `treasures` | `jungle_temples` | … (extensible)
  - `role`: `input` | `output`
  - `name` or `label`: e.g. “Villages”, “Villages with Y (2024-01-15)”
  - `filePath` or stored content (app-managed path under user data, or in-app storage)
  - Optional: `sourceDatasetId` (for outputs: which input this run used)
  - `createdAt`
- **Recorder type** (for future)
  - e.g. `village_y` → uses input with `type: villages`, produces output with same type and role `output`.

Storage can be file-based (e.g. JSON index + files in `~/AppData/.../mc-bot-app/projects/<id>/`) or a local DB (e.g. SQLite). No cloud required.

---

## Functional Requirements

### FR1: Projects

- Create a new project (name, optional connection).
- List projects; open one to see its datasets and run recorders.
- Edit project name and connection.
- Delete a project (and optionally its stored files).

### FR2: Input datasets

- Add an input CSV to a project: file picker or drag-and-drop; user assigns a type (villages, treasures, jungle temples, or custom label). App stores the file and shows it in the project.
- List input datasets per project (name, type, date added).
- Remove an input dataset from the project (and delete stored file if desired).
- Retrieve: download, open containing folder, or view raw/preview in app.

### FR3: Output datasets

- When a recorder run completes, the app stores the output file as an output dataset in the same project (linked to the input used).
- List output datasets per project (name/label, type, date, optional link to input).
- Retrieve: download, open containing folder, or view raw/preview in app.
- Optional: delete an output dataset.

### FR4: Run Village Y recorder

- From a project view: choose an input dataset of type “villages” (or compatible).
- Button “Run Village Y recorder”. App starts the bot (or uses existing connection), runs the village Y recorder with that input, writes result to app storage, and creates a new output dataset (e.g. “Villages with Y” + timestamp).
- Show progress (e.g. “Village 12/46”) and completion or error. On completion, show the new output in the list and allow retrieve.

### FR5: Connection

- Per project: optional server host, port, bot username. Used when “Run” is clicked so the app knows where to connect.
- Connection state: “Connected” / “Disconnected” / “Error”. If running a recorder, app connects first (or reuses existing), then runs the recorder.

### FR6: Persistence

- Projects and dataset metadata (and optionally file paths) persist across app restarts. Stored under standard app data (e.g. Electron `app.getPath('userData')`).

---

## Non-Functional Requirements

### NFR1: Single desktop app

- One installable desktop app (e.g. Electron). The user does not need to run the bot separately or edit `.env` for paths; the app embeds or drives the bot and stores paths/data.

### NFR2: Offline-first

- No required cloud or account. All data (projects, CSVs) stored locally.

### NFR3: Usability

- Clear navigation: project list → project detail (datasets + run). Retrieval (download/open/view) obvious from dataset list or detail.

---

## UI Outline

- **Home / Project list:** List of projects; “New project”; open a project.
- **Project view:**
  - Project name and connection (editable).
  - **Inputs:** List of input CSVs (name, type, date). Actions: Add, Remove, Retrieve (download / open folder / view).
  - **Outputs:** List of output CSVs (name, type, date, source). Actions: Retrieve (download / open folder / view); optional Remove.
  - **Run:** Dropdown or button to pick “Village Y recorder”, choose input dataset, “Run”. Progress area; on done, new output appears in list.
- **Connection:** In project view, “Connect” / “Disconnect” and status; connection params (host, port, username) editable when disconnected.

---

## Technical Notes

- **Electron** recommended: reuse existing Node mc-bot code; run bot in main process or worker; renderer is the UI (e.g. React or vanilla HTML/JS).
- **Bot lifecycle:** App spawns the bot when user runs a recorder (or on “Connect”); passes input/output paths from app storage (temp or project folder) so recorder reads/writes there. No `.env` paths for CSV in/out.
- **Recorder integration:** Call existing `runVillageRecorder(bot, config)` with `config` built from project connection + chosen input path + output path (app-managed). Progress can be exposed via events or polling from the existing logger.
- **Dataset types:** Start with `villages` for Village Y recorder. Later: `treasures`, `jungle_temples`, etc., and more recorders.

---

## Edge Cases

- **No connection:** Disable “Run” or show “Set connection first”.
- **Bot already running elsewhere:** Either “App owns the bot” (single connection per app) or document “Close other clients for this server”.
- **Large CSVs:** Stream or chunk when displaying; store files on disk to avoid memory bloat.
- **Invalid input CSV:** Recorder already validates (x/z columns); app can show “Invalid file” on add if basic checks fail.

---

## Success Criteria

- User can create a project and add/upload at least one input CSV (e.g. villages), with type/label.
- User can run “Village Y recorder” from the app for that project and see progress; on completion, the output CSV is stored in the project.
- User can retrieve stored input and output CSVs (download or open folder) without touching `.env`.
- Projects and datasets persist across app restarts.
