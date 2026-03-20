const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mcBot", {
  getAppPath: () => ipcRenderer.invoke("getAppPath"),
  projects: {
    list: () => ipcRenderer.invoke("projects:list"),
    create: (opts) => ipcRenderer.invoke("projects:create", opts),
    update: (opts) => ipcRenderer.invoke("projects:update", opts),
    delete: (id) => ipcRenderer.invoke("projects:delete", id),
  },
  datasets: {
    list: (projectId) => ipcRenderer.invoke("datasets:list", projectId),
    addInput: (opts) => ipcRenderer.invoke("datasets:addInput", opts),
    remove: (opts) => ipcRenderer.invoke("datasets:remove", opts),
    readFile: (filePath) => ipcRenderer.invoke("datasets:readFile", filePath),
  },
  shell: {
    showItemInFolder: (filePath) => ipcRenderer.invoke("shell:showItemInFolder", filePath),
    openPath: (path) => ipcRenderer.invoke("shell:openPath", path),
  },
  dialog: {
    openCsv: () => ipcRenderer.invoke("dialog:openCsv"),
    saveCsvCopy: (opts) => ipcRenderer.invoke("dialog:saveCsvCopy", opts),
  },
  recorder: {
    runVillageY: (opts) => ipcRenderer.invoke("recorder:runVillageY", opts),
    runJunglePyramids: (opts) => ipcRenderer.invoke("recorder:runJunglePyramids", opts),
    runDesertWells: (opts) => ipcRenderer.invoke("recorder:runDesertWells", opts),
    runDesertPyramids: (opts) => ipcRenderer.invoke("recorder:runDesertPyramids", opts),
    runPillagerOutposts: (opts) => ipcRenderer.invoke("recorder:runPillagerOutposts", opts),
    runIgloos: (opts) => ipcRenderer.invoke("recorder:runIgloos", opts),
    stop: () => ipcRenderer.invoke("recorder:stop"),
    onProgress: (cb) => {
      const sub = (_e, data) => cb(data);
      ipcRenderer.on("recorder:progress", sub);
      return () => ipcRenderer.removeListener("recorder:progress", sub);
    },
  },
});
