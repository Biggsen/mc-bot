import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { readFile, writeFile, mkdir, readdir, unlink, copyFile } from "fs/promises";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev =
  process.env.NODE_ENV !== "production" &&
  !app.isPackaged &&
  process.env.ELECTRON_DEV === "1";

// Force Chromium cache into userData so it's always writable (avoids Windows Access Denied)
app.setPath("cache", join(app.getPath("userData"), "Cache"));
app.setPath("sessionData", join(app.getPath("userData"), "Session"));

function getAppDataPath() {
  return join(app.getPath("userData"), "mc-bot-app");
}

function getProjectsPath() {
  return join(getAppDataPath(), "projects");
}

function getIndexPath() {
  return join(getAppDataPath(), "index.json");
}

async function ensureAppData() {
  const base = getAppDataPath();
  const projects = getProjectsPath();
  if (!existsSync(base)) await mkdir(base, { recursive: true });
  if (!existsSync(projects)) await mkdir(projects, { recursive: true });
}

async function loadIndex() {
  await ensureAppData();
  const path = getIndexPath();
  if (!existsSync(path)) return { projects: [], nextId: 1 };
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function saveIndex(index) {
  await ensureAppData();
  await writeFile(getIndexPath(), JSON.stringify(index, null, 2), "utf-8");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 720,
    minHeight: 520,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, "..", "dist", "index.html"));
  }
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("getAppPath", () => getAppDataPath());

ipcMain.handle("projects:list", async () => {
  const index = await loadIndex();
  return index.projects;
});

ipcMain.handle("projects:create", async (_, { name, connection }) => {
  const index = await loadIndex();
  const id = String(index.nextId++);
  const project = {
    id,
    name: name || "New project",
    connection: connection || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  index.projects.push(project);
  const projectDir = join(getProjectsPath(), id);
  if (!existsSync(projectDir)) await mkdir(projectDir, { recursive: true });
  await saveIndex(index);
  return project;
});

ipcMain.handle("projects:update", async (_, { id, name, connection }) => {
  const index = await loadIndex();
  const p = index.projects.find((x) => x.id === id);
  if (!p) throw new Error("Project not found");
  if (name !== undefined) p.name = name;
  if (connection !== undefined) p.connection = connection;
  p.updatedAt = new Date().toISOString();
  await saveIndex(index);
  return p;
});

ipcMain.handle("projects:delete", async (_, id) => {
  const index = await loadIndex();
  const i = index.projects.findIndex((x) => x.id === id);
  if (i < 0) throw new Error("Project not found");
  index.projects.splice(i, 1);
  const projectDir = join(getProjectsPath(), id);
  if (existsSync(projectDir)) {
    const files = await readdir(projectDir);
    for (const f of files) await unlink(join(projectDir, f));
  }
  await saveIndex(index);
  return { ok: true };
});

ipcMain.handle("datasets:list", async (_, projectId) => {
  const index = await loadIndex();
  const project = index.projects.find((x) => x.id === projectId);
  if (!project) throw new Error("Project not found");
  const list = project.datasets || [];
  return list;
});

ipcMain.handle("datasets:addInput", async (_, { projectId, type, name, filePath }) => {
  const index = await loadIndex();
  const project = index.projects.find((x) => x.id === projectId);
  if (!project) throw new Error("Project not found");
  if (!project.datasets) project.datasets = [];
  const id = `input-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const projectDir = join(getProjectsPath(), projectId);
  await ensureAppData();
  if (!existsSync(projectDir)) await mkdir(projectDir, { recursive: true });
  const storedName = `${id}.csv`;
  const destPath = join(projectDir, storedName);
  await copyFile(filePath, destPath);
  const dataset = {
    id,
    projectId,
    type: type || "villages",
    role: "input",
    name: name || `Input ${type || "villages"}`,
    filePath: destPath,
    createdAt: new Date().toISOString(),
  };
  project.datasets.push(dataset);
  project.updatedAt = new Date().toISOString();
  await saveIndex(index);
  return dataset;
});

ipcMain.handle("datasets:addOutput", async (_, { projectId, type, name, filePath, sourceDatasetId }) => {
  const index = await loadIndex();
  const project = index.projects.find((x) => x.id === projectId);
  if (!project) throw new Error("Project not found");
  if (!project.datasets) project.datasets = [];
  const id = `output-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const projectDir = join(getProjectsPath(), projectId);
  const storedName = `${id}.csv`;
  const destPath = join(projectDir, storedName);
  await copyFile(filePath, destPath);
  const dataset = {
    id,
    projectId,
    type: type || "villages",
    role: "output",
    name: name || `Output ${type || "villages"}`,
    filePath: destPath,
    sourceDatasetId: sourceDatasetId || null,
    createdAt: new Date().toISOString(),
  };
  project.datasets.push(dataset);
  project.updatedAt = new Date().toISOString();
  await saveIndex(index);
  return dataset;
});

ipcMain.handle("datasets:remove", async (_, { projectId, datasetId }) => {
  const index = await loadIndex();
  const project = index.projects.find((x) => x.id === projectId);
  if (!project) throw new Error("Project not found");
  const list = project.datasets || [];
  const d = list.find((x) => x.id === datasetId);
  if (!d) throw new Error("Dataset not found");
  if (existsSync(d.filePath)) await unlink(d.filePath);
  project.datasets = list.filter((x) => x.id !== datasetId);
  project.updatedAt = new Date().toISOString();
  await saveIndex(index);
  return { ok: true };
});

ipcMain.handle("datasets:readFile", async (_, filePath) => {
  return await readFile(filePath, "utf-8");
});

ipcMain.handle("shell:showItemInFolder", (_, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle("shell:openPath", (_, path) => {
  return shell.openPath(path);
});

ipcMain.handle("dialog:openCsv", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(win || null, {
    title: "Select CSV file",
    filters: [{ name: "CSV", extensions: ["csv"] }, { name: "All", extensions: ["*"] }],
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle("dialog:saveCsvCopy", async (_, { sourcePath, defaultFileName }) => {
  if (!sourcePath || !existsSync(sourcePath)) {
    throw new Error("Source file not found");
  }
  const win = BrowserWindow.getFocusedWindow();
  const suggested = defaultFileName?.trim() || basename(sourcePath);
  const { canceled, filePath } = await dialog.showSaveDialog(win || null, {
    title: "Save CSV",
    defaultPath: suggested,
    filters: [{ name: "CSV", extensions: ["csv"] }, { name: "All", extensions: ["*"] }],
  });
  if (canceled || !filePath) return { canceled: true };
  await copyFile(sourcePath, filePath);
  return { canceled: false, filePath };
});

ipcMain.handle("recorder:runVillageY", async (event, { projectId, inputDatasetId, connection }) => {
  const index = await loadIndex();
  const project = index.projects.find((x) => x.id === projectId);
  if (!project) throw new Error("Project not found");
  const inputDs = (project.datasets || []).find((d) => d.id === inputDatasetId && d.role === "input");
  if (!inputDs) throw new Error("Input dataset not found");
  if (!connection || !connection.host || !connection.port || !connection.username) {
    throw new Error("Project connection (host, port, username) is required");
  }
  const projectDir = join(getProjectsPath(), projectId);
  const outputId = `output-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const outputPath = join(projectDir, `${outputId}.csv`);

  const sendProgress = (current, total) => {
    event.sender.send("recorder:progress", { current, total });
  };

  const { createBot } = await import("mc-bot/lib");
  const { attachEvents } = await import("mc-bot/lib");
  const { runVillageRecorder } = await import("mc-bot/lib");
  const { buildBotConfigFromConnection } = await import("mc-bot/lib");

  const botConfig = buildBotConfigFromConnection({
    host: connection.host,
    port: Number(connection.port),
    username: connection.username,
    version: connection.version || undefined,
  });
  const bot = createBot(botConfig);
  attachEvents(bot, botConfig, { onEnd: () => {} });

  await new Promise((resolve, reject) => {
    bot.once("spawn", resolve);
    bot.once("error", reject);
    bot.once("kicked", (reason) => reject(new Error(String(reason))));
    bot.once("end", (reason) => reject(new Error("Disconnected: " + (reason || "unknown"))));
  });

  const recorderConfig = {
    csvPath: inputDs.filePath,
    outputPath,
    tpY: 200,
    delayAfterTpMs: 500,
    waitForGround: true,
    groundTimeoutMs: 15000,
  };

  try {
    await runVillageRecorder(bot, recorderConfig, {
      onProgress: (p) => sendProgress(p.current, p.total),
    });
  } finally {
    bot.quit?.("Desktop app run complete");
  }

  const outputName = `Villages with Y (${new Date().toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  })})`;
  const index2 = await loadIndex();
  const proj2 = index2.projects.find((x) => x.id === projectId);
  if (!proj2) throw new Error("Project not found");
  if (!proj2.datasets) proj2.datasets = [];
  const outputDs = {
    id: outputId,
    projectId,
    type: "villages",
    role: "output",
    name: outputName,
    filePath: outputPath,
    sourceDatasetId: inputDatasetId,
    createdAt: new Date().toISOString(),
  };
  proj2.datasets.push(outputDs);
  proj2.updatedAt = new Date().toISOString();
  await saveIndex(index2);
  return outputDs;
});

ipcMain.handle("recorder:runJunglePyramids", async (event, { projectId, inputDatasetId, connection }) => {
  const index = await loadIndex();
  const project = index.projects.find((x) => x.id === projectId);
  if (!project) throw new Error("Project not found");
  const inputDs = (project.datasets || []).find((d) => d.id === inputDatasetId && d.role === "input");
  if (!inputDs) throw new Error("Input dataset not found");
  if (!connection || !connection.host || !connection.port || !connection.username) {
    throw new Error("Project connection (host, port, username) is required");
  }
  const projectDir = join(getProjectsPath(), projectId);
  const outputId = `output-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const outputPath = join(projectDir, `${outputId}.csv`);

  const sendProgress = (current, total) => {
    event.sender.send("recorder:progress", { current, total });
  };

  const { createBot } = await import("mc-bot/lib");
  const { attachEvents } = await import("mc-bot/lib");
  const { runVillageRecorder } = await import("mc-bot/lib");
  const { buildBotConfigFromConnection } = await import("mc-bot/lib");

  const botConfig = buildBotConfigFromConnection({
    host: connection.host,
    port: Number(connection.port),
    username: connection.username,
    version: connection.version || undefined,
  });
  const bot = createBot(botConfig);
  attachEvents(bot, botConfig, { onEnd: () => {} });

  await new Promise((resolve, reject) => {
    bot.once("spawn", resolve);
    bot.once("error", reject);
    bot.once("kicked", (reason) => reject(new Error(String(reason))));
    bot.once("end", (reason) => reject(new Error("Disconnected: " + (reason || "unknown"))));
  });

  const recorderConfig = {
    csvPath: inputDs.filePath,
    outputPath,
    tpY: 200,
    delayAfterTpMs: 500,
    waitForGround: true,
    groundTimeoutMs: 15000,
  };

  try {
    await runVillageRecorder(bot, recorderConfig, {
      onProgress: (p) => sendProgress(p.current, p.total),
    });
  } finally {
    bot.quit?.("Desktop app run complete");
  }

  const outputName = `Jungle pyramids with Y (${new Date().toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  })})`;
  const index2 = await loadIndex();
  const proj2 = index2.projects.find((x) => x.id === projectId);
  if (!proj2) throw new Error("Project not found");
  if (!proj2.datasets) proj2.datasets = [];
  const outputDs = {
    id: outputId,
    projectId,
    type: "jungle_pyramids",
    role: "output",
    name: outputName,
    filePath: outputPath,
    sourceDatasetId: inputDatasetId,
    createdAt: new Date().toISOString(),
  };
  proj2.datasets.push(outputDs);
  proj2.updatedAt = new Date().toISOString();
  await saveIndex(index2);
  return outputDs;
});
