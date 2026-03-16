# Minecraft Bot Repo Spec
## Local Docker Minecraft Servers + Mineflayer

## Purpose

Build a small Node.js project that can run one or more Minecraft bots against locally hosted Docker-based Minecraft servers.

The initial goal is not a full framework. It is a clean, reliable starter repo that:

- connects a bot to a local Minecraft server
- works with Docker-hosted servers
- is easy to extend in Cursor
- supports simple scripted behaviours
- is structured so more features can be added later

This project should prioritize simplicity, readability, and easy iteration.

---

## Core Technical Direction

### Stack
- Node.js
- Mineflayer
- JavaScript or TypeScript
- Optional Docker support for the bot itself
- Environment variables for configuration

### Minecraft Context
- Primary use case: local Docker Minecraft servers
- First target: Java Edition server
- Prefer local testing in offline mode first
- The bot should connect either:
  - from the host machine to a Docker-published server port, or
  - from another container on the same Docker network

### Main Library
Use **Mineflayer** as the core bot library.

Optional later additions:
- `mineflayer-pathfinder`
- `prismarine-viewer`
- inventory or combat plugins later if needed

---

## Project Goals

### Phase 1
Deliver a working baseline repo that can:

1. start a bot
2. connect to a configured Minecraft server
3. log key lifecycle events
4. send a chat message on spawn
5. respond to a few basic chat commands
6. disconnect cleanly
7. support configuration via `.env`

### Phase 2
Add better structure:

1. separate config from bot logic
2. support multiple behaviours/modules
3. support multiple bot profiles
4. better reconnect and error handling
5. optional pathfinding

### Phase 3
Optional expansion:

1. run multiple bots
2. provide a simple command system
3. add a web viewer
4. add task-based actions
5. add bot orchestration

---

## Key Requirements

### Functional Requirements

#### FR1: Basic connection
The repo must allow a bot to connect to a Minecraft Java server using:
- host
- port
- username
- auth mode if needed
- version setting if needed

#### FR2: Local Docker support
The repo must clearly support both of these cases:

**Case A: Bot runs on host machine**
- Minecraft server runs in Docker
- server port is published to localhost
- bot connects to `localhost:<port>`

**Case B: Bot runs in Docker**
- both bot and server run in Docker
- both share the same Docker network
- bot connects using the Minecraft service/container name

#### FR3: Environment configuration
The bot must read runtime configuration from environment variables.

Minimum environment values:
- `MC_HOST`
- `MC_PORT`
- `MC_USERNAME`
- `MC_VERSION`
- `MC_AUTH`

Optional:
- `BOT_CHAT_ON_SPAWN`
- `BOT_RECONNECT`
- `BOT_RECONNECT_DELAY_MS`

#### FR4: Event logging
The bot should log:
- starting
- connected/spawned
- chat messages seen
- kicked
- disconnected
- reconnect attempts
- errors

Logs should be readable and useful for local debugging.

#### FR5: Basic chat interaction
The bot should support a few simple commands from in-game chat, for example:
- `ping` → `pong`
- `hello` → greeting
- `where` → simple status reply

Do not overbuild the command system initially.

#### FR6: Clean project structure
The repo should not be a single giant file. It should separate:
- entrypoint
- config loading
- bot creation
- event wiring
- command handlers
- optional behaviours

#### FR7: Safe defaults
The first version should be optimized for local testing, not public server deployment.

Defaults should assume:
- local server
- offline mode where appropriate
- no secrets committed
- simple setup

---

## Non-Functional Requirements

### NFR1: Easy to understand
A developer opening the repo should quickly understand:
- where configuration lives
- where the bot is created
- where events are handled
- where commands are defined

### NFR2: Easy to extend
The structure should make it easy to add:
- movement
- pathfinding
- inventory logic
- region-based actions
- multiple bots later

### NFR3: Good local developer experience
The repo should include:
- clear README
- sample `.env.example`
- straightforward start command
- predictable logs

### NFR4: Minimal initial complexity
Do not introduce:
- databases
- message queues
- web dashboards
- unnecessary abstractions
unless there is a clear placeholder for future growth

---

## Suggested Repo Structure

```text
minecraft-bot/
  README.md
  package.json
  .env.example
  .gitignore
  docker-compose.yml                # optional starter setup
  src/
    index.js                        # or index.ts
    config/
      env.js
    bot/
      createBot.js
      attachEvents.js
    commands/
      chatCommands.js
    utils/
      logger.js
```

If using TypeScript:

```text
minecraft-bot/
  tsconfig.json
  src/
    index.ts
    config/
      env.ts
    bot/
      createBot.ts
      attachEvents.ts
    commands/
      chatCommands.ts
    utils/
      logger.ts
```

Keep it small.

---

## Recommended Behaviour Design

### Entrypoint
The entrypoint should:
1. load config
2. validate config
3. create the bot
4. attach event handlers
5. start runtime logic

### Bot creation
A dedicated function should create the Mineflayer bot using config.

### Event attachment
A dedicated module should wire core Mineflayer events such as:
- `spawn`
- `chat`
- `kicked`
- `error`
- `end`

### Commands
Keep initial commands simple and isolated in a command handler module.

### Logger
Use a lightweight logger approach.
Simple console-based logging is fine for v1.

---

## Initial Environment Contract

### `.env.example`

```env
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=TestBot123
MC_VERSION=
MC_AUTH=offline

BOT_CHAT_ON_SPAWN=hello from bot
BOT_RECONNECT=true
BOT_RECONNECT_DELAY_MS=5000
```

### Notes
- Blank `MC_VERSION` can mean auto-detect
- `MC_AUTH=offline` should be the easiest local default
- online auth can be added later if needed

---

## Connection Scenarios

### Scenario 1: Minecraft server in Docker, bot on host
Example:
- Docker publishes `25565:25565`
- bot runs via local Node.js
- config:
  - `MC_HOST=localhost`
  - `MC_PORT=25565`

### Scenario 2: Minecraft server in Docker, bot in Docker
Example:
- Minecraft service name: `mc`
- bot service on same Docker network
- config:
  - `MC_HOST=mc`
  - `MC_PORT=25565`

The README should explain the difference clearly:
inside Docker, `localhost` refers to the current container, not the Minecraft container.

---

## Docker Guidance

### Optional starter `docker-compose.yml`
It is useful to include a starter compose file that shows:

- a Paper server container
- a bot container
- shared networking
- mounted bot project folder

This does not need to be production-ready. It only needs to demonstrate local development clearly.

### Example intention
The compose setup should show:
- `mc` service for server
- `bot` service for Node app
- `depends_on`
- volume mount for iterative development

---

## Suggested Initial Features

### Feature 1: Spawn announcement
When the bot spawns, it should:
- log success
- optionally chat a spawn message if configured

### Feature 2: Simple chat command handler
On chat from another player:
- ignore messages from itself
- match a few simple commands
- reply with canned responses

### Feature 3: Reconnect handling
If enabled:
- when disconnected, log the event
- wait configured delay
- attempt reconnect

Keep reconnect logic conservative and simple.

### Feature 4: Config validation
On startup:
- validate required environment values
- fail fast with readable errors if invalid

---

## Out of Scope for v1

Do not build these yet unless needed:

- combat AI
- farming/mining automation
- anti-AFK systems
- account management for Microsoft auth
- plugin-heavy architecture
- persistence/database layer
- GUI dashboard
- public server stealth features
- anything aimed at bypassing server rules

This repo is a clean starter, not a full automation suite.

---

## Risks and Constraints

### R1: Version mismatch
Mineflayer and server version differences can cause disconnects or odd behaviour.

The project should allow explicit version configuration.

### R2: Auth complexity
Offline/local mode is simple.
Microsoft/online auth is more complex and should not be the default path for the first build.

### R3: Docker networking confusion
A common pitfall is using `localhost` incorrectly inside containers.

The documentation should call this out clearly.

### R4: Over-engineering
The project can become bloated very quickly.
Keep the first iteration narrow and testable.

---

## README Requirements

The README should include:

### 1. What this repo is
A local development starter for Minecraft bots using Mineflayer.

### 2. Main use cases
- connect to local Docker Minecraft servers
- test basic bot interactions
- serve as a base for future bot features

### 3. Prerequisites
- Node.js
- Docker Desktop or equivalent
- a running Minecraft Java server

### 4. Setup steps
- clone repo
- install dependencies
- copy `.env.example` to `.env`
- edit config
- run start command

### 5. Run modes
Explain:
- bot on host
- bot in Docker

### 6. Common problems
Include short troubleshooting for:
- cannot connect
- kicked immediately
- wrong host in Docker
- wrong version
- auth mode mismatch

---

## Cursor Build Prompt

Use something close to this when asking Cursor to build the repo:

> Build a small, clean Node.js project using Mineflayer for Minecraft Java bots. The main use case is connecting to local Docker-hosted Minecraft servers. Support configuration through environment variables. Keep the structure simple and modular: config loading, bot creation, event wiring, and chat command handling. Include a README, `.env.example`, and a minimal starter `docker-compose.yml`. Optimize for local testing and offline mode first. Do not over-engineer. Use readable logs and include basic reconnect support.

---

## Acceptance Criteria

The first build is successful if:

1. I can run `npm install`
2. I can configure `.env`
3. I can run the bot locally
4. the bot connects to my local Docker Minecraft server
5. the bot logs spawn/disconnect/error events
6. the bot sends a spawn chat message
7. the bot responds to simple in-game chat commands
8. the project structure is clean enough to extend in Cursor

---

## Nice-to-Have After v1

After the baseline works, next additions could be:

1. `mineflayer-pathfinder`
2. simple movement commands
3. follow player command
4. browser viewer with `prismarine-viewer`
5. multi-bot profiles
6. task/behaviour modules
7. server-specific config presets

---

## Final Direction

Build this as a **small starter repo**, not a platform.

The main success condition is:
- easy local setup
- reliable connection to Docker Minecraft servers
- clean structure for future iteration
