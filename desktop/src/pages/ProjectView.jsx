import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";

function sanitizeFileSegment(s) {
  return String(s || "unknown")
    .toLowerCase()
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

function localDateYyyyMmDd(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** test-server-villages-2026-03-19.csv */
function buildDownloadFileName(serverName, datasetType, createdAt) {
  const server = sanitizeFileSegment(serverName);
  const type = sanitizeFileSegment(datasetType);
  const date = localDateYyyyMmDd(createdAt);
  return `${server}-${type}-${date}.csv`;
}

export default function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("25565");
  const [username, setUsername] = useState("");
  const [runInputId, setRunInputId] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewPath, setPreviewPath] = useState(null);

  const loadProject = useCallback(async () => {
    if (!window.mcBot) return null;
    const list = await window.mcBot.projects.list();
    const p = list.find((x) => x.id === projectId);
    setProjects(list);
    return p;
  }, [projectId]);

  const loadDatasets = useCallback(async () => {
    if (!window.mcBot || !projectId) return;
    const list = await window.mcBot.datasets.list(projectId);
    setDatasets(list);
  }, [projectId]);

  useEffect(() => {
    let ok = true;
    (async () => {
      const p = await loadProject();
      if (!ok) return;
      setProject(p);
      if (p) {
        setName(p.name);
        setHost(p.connection?.host ?? "");
        setPort(String(p.connection?.port ?? "25565"));
        setUsername(p.connection?.username ?? "");
        await loadDatasets();
      }
      setLoading(false);
    })();
    return () => { ok = false; };
  }, [projectId, loadProject, loadDatasets]);

  useEffect(() => {
    if (!window.mcBot?.recorder?.onProgress || !projectId) return;
    const unsub = window.mcBot.recorder.onProgress((data) => {
      setProgress({ current: data.current, total: data.total });
    });
    return unsub;
  }, [projectId]);

  async function handleSaveConnection(e) {
    e.preventDefault();
    if (!window.mcBot || !project) return;
    setEditing(false);
    try {
      const updated = await window.mcBot.projects.update({
        id: project.id,
        name: name.trim() || project.name,
        connection:
          host.trim() && port.trim() && username.trim()
            ? {
                host: host.trim(),
                port: parseInt(port, 10) || 25565,
                username: username.trim(),
              }
            : null,
      });
      setProject(updated);
    } catch (err) {
      alert(err.message || "Failed to update");
    }
  }

  async function handleAddInput() {
    if (!window.mcBot || !projectId) return;
    const filePath = await window.mcBot.dialog.openCsv();
    if (!filePath) return;
    const nameFromPath = filePath.split(/[/\\]/).pop()?.replace(/\.csv$/i, "") ?? "Input";
    const type = "villages";
    try {
      await window.mcBot.datasets.addInput({
        projectId,
        type,
        name: nameFromPath,
        filePath,
      });
      await loadDatasets();
    } catch (err) {
      alert(err.message || "Failed to add file");
    }
  }

  async function handleRemoveDataset(datasetId) {
    if (!window.mcBot || !projectId || !confirm("Remove this dataset?")) return;
    try {
      await window.mcBot.datasets.remove({ projectId, datasetId });
      await loadDatasets();
      if (previewPath) setPreviewContent(null);
      setPreviewPath(null);
    } catch (err) {
      alert(err.message || "Failed to remove");
    }
  }

  async function handleShowInFolder(filePath) {
    if (!window.mcBot) return;
    await window.mcBot.shell.showItemInFolder(filePath);
  }

  async function handlePreview(filePath) {
    if (!window.mcBot) return;
    try {
      const content = await window.mcBot.datasets.readFile(filePath);
      setPreviewContent(content);
      setPreviewPath(filePath);
    } catch (err) {
      alert(err.message || "Failed to read file");
    }
  }

  async function handleDownload(dataset) {
    if (!window.mcBot || !project) return;
    try {
      const defaultFileName = buildDownloadFileName(
        project.name,
        dataset.type,
        dataset.createdAt
      );
      const result = await window.mcBot.dialog.saveCsvCopy({
        sourcePath: dataset.filePath,
        defaultFileName,
      });
      if (!result.canceled && result.filePath) {
        await window.mcBot.shell.showItemInFolder(result.filePath);
      }
    } catch (err) {
      alert(err.message || "Failed to save file");
    }
  }

  async function handleRunVillageY(e) {
    e.preventDefault();
    if (!window.mcBot || !projectId || !runInputId) return;
    const conn = project?.connection;
    if (!conn?.host || !conn?.port || !conn?.username) {
      setError("Set connection (host, port, username) first.");
      return;
    }
    setError(null);
    setRunning(true);
    setProgress(null);
    try {
      await window.mcBot.recorder.runVillageY({
        projectId,
        inputDatasetId: runInputId,
        connection: conn,
      });
      setProgress(null);
      await loadDatasets();
    } catch (err) {
      setError(err.message || "Recorder failed");
    } finally {
      setRunning(false);
    }
  }

  const inputs = datasets.filter((d) => d.role === "input");
  const outputs = datasets.filter((d) => d.role === "output");
  const villageInputs = inputs.filter((d) => d.type === "villages");

  if (loading) return <div style={styles.msg}>Loading…</div>;
  if (!project) return <div style={styles.msg}>Project not found.</div>;
  if (!window.mcBot) return <div style={styles.msg}>Not running in Electron.</div>;

  return (
    <div>
      <div style={styles.back}>
        <Link to="/">← Projects</Link>
      </div>

      <section style={styles.section}>
        <h1 style={styles.title}>{project.name}</h1>
        {editing ? (
          <form onSubmit={handleSaveConnection} style={styles.form}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              style={styles.input}
            />
            <input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="Host"
              style={styles.input}
            />
            <input
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="Port"
              style={styles.inputShort}
            />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Bot username"
              style={styles.input}
            />
            <button type="submit" style={styles.btn}>Save</button>
            <button type="button" onClick={() => setEditing(false)} style={styles.btnSecondary}>
              Cancel
            </button>
          </form>
        ) : (
          <div style={styles.meta}>
            <span>
              Connection:{" "}
              {project.connection
                ? `${project.connection.host}:${project.connection.port} (${project.connection.username})`
                : "Not set"}
            </span>
            <button type="button" onClick={() => setEditing(true)} style={styles.linkBtn}>
              Edit
            </button>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Input datasets</h2>
        <button type="button" onClick={handleAddInput} style={styles.btn}>
          Add CSV…
        </button>
        <DatasetList
          items={inputs}
          onRemove={handleRemoveDataset}
          onShowInFolder={handleShowInFolder}
          onPreview={handlePreview}
          onDownload={handleDownload}
        />
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Output datasets</h2>
        <DatasetList
          items={outputs}
          onRemove={handleRemoveDataset}
          onShowInFolder={handleShowInFolder}
          onPreview={handlePreview}
          onDownload={handleDownload}
        />
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Run Village Y recorder</h2>
        <form onSubmit={handleRunVillageY} style={styles.runForm}>
          <select
            value={runInputId}
            onChange={(e) => setRunInputId(e.target.value)}
            style={styles.select}
            disabled={running}
          >
            <option value="">Select villages input…</option>
            {villageInputs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.type})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={running || !runInputId}
            style={styles.btn}
          >
            {running ? "Running…" : "Run Village Y recorder"}
          </button>
        </form>
        {progress && (
          <p style={styles.progress}>
            Village {progress.current}/{progress.total}
          </p>
        )}
        {error && <p style={styles.error}>{error}</p>}
      </section>

      {previewContent !== null && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Preview</h2>
          <p style={styles.previewPath}>{previewPath}</p>
          <pre style={styles.pre}>{previewContent}</pre>
          <button type="button" onClick={() => setPreviewContent(null)} style={styles.btnSecondary}>
            Close
          </button>
        </section>
      )}
    </div>
  );
}

function DatasetList({ items, onRemove, onShowInFolder, onPreview, onDownload }) {
  return (
    <ul style={styles.list}>
      {items.length === 0 && <li style={styles.empty}>None</li>}
      {items.map((d) => (
        <li key={d.id} style={styles.datasetItem}>
          <span style={styles.datasetName}>{d.name}</span>
          <span style={styles.datasetMeta}>{d.type} · {d.role}</span>
          <div style={styles.datasetActions}>
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(d)}
                style={styles.linkBtn}
              >
                Download
              </button>
            )}
            <button type="button" onClick={() => onPreview(d.filePath)} style={styles.linkBtn}>
              View
            </button>
            <button type="button" onClick={() => onShowInFolder(d.filePath)} style={styles.linkBtn}>
              Show in folder
            </button>
            <button type="button" onClick={() => onRemove(d.id)} style={styles.linkBtnDanger}>
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const styles = {
  msg: { padding: "2rem", color: "#94a3b8" },
  back: { marginBottom: "1rem" },
  section: { marginBottom: "2rem" },
  title: { margin: "0 0 0.5rem 0", fontSize: "1.5rem" },
  h2: { margin: "0 0 0.5rem 0", fontSize: "1.1rem" },
  form: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" },
  runForm: { display: "flex", gap: "0.5rem", alignItems: "center" },
  meta: { display: "flex", gap: "0.5rem", alignItems: "center", color: "#94a3b8", fontSize: "0.9rem" },
  input: { padding: "0.4rem 0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#eaeaea", width: "140px" },
  inputShort: { padding: "0.4rem 0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#eaeaea", width: "70px" },
  select: { padding: "0.4rem 0.6rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#eaeaea", minWidth: "200px" },
  btn: { padding: "0.4rem 0.8rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px" },
  btnSecondary: { padding: "0.4rem 0.8rem", background: "transparent", color: "#94a3b8", border: "1px solid #475569", borderRadius: "6px" },
  linkBtn: { background: "none", border: "none", color: "#7dd3fc", padding: "0.2rem 0.4rem", fontSize: "0.875rem" },
  linkBtnDanger: { background: "none", border: "none", color: "#f87171", padding: "0.2rem 0.4rem", fontSize: "0.875rem" },
  list: { listStyle: "none", margin: "0.5rem 0 0", padding: 0 },
  empty: { color: "#64748b", fontSize: "0.9rem" },
  datasetItem: { padding: "0.5rem 0", borderBottom: "1px solid #334155", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  datasetName: { fontWeight: 500 },
  datasetMeta: { fontSize: "0.8rem", color: "#64748b" },
  datasetActions: { marginLeft: "auto", display: "flex", gap: "0.25rem" },
  progress: { margin: "0.5rem 0 0", color: "#7dd3fc" },
  error: { margin: "0.5rem 0 0", color: "#f87171" },
  previewPath: { fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" },
  pre: { background: "#0f172a", padding: "1rem", borderRadius: "6px", overflow: "auto", maxHeight: "300px", fontSize: "0.8rem", margin: "0 0 0.5rem 0" },
};
