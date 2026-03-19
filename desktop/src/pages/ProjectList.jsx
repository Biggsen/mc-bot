import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();

  async function load() {
    if (!window.mcBot) return;
    try {
      const list = await window.mcBot.projects.list();
      setProjects(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!window.mcBot || !newName.trim()) return;
    setCreating(true);
    try {
      const project = await window.mcBot.projects.create({
        name: newName.trim(),
        connection: null,
      });
      setNewName("");
      navigate(`/project/${project.id}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.mcBot || !confirm("Delete this project and all its datasets?")) return;
    try {
      await window.mcBot.projects.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  }

  if (loading) return <div style={styles.msg}>Loading projects…</div>;
  if (!window.mcBot) return <div style={styles.msg}>Not running in Electron.</div>;

  return (
    <div>
      <div style={styles.top}>
        <h1 style={styles.title}>Projects</h1>
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            style={styles.input}
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newName.trim()} style={styles.btn}>
            New project
          </button>
        </form>
      </div>

      <ul style={styles.list}>
        {projects.length === 0 && (
          <li style={styles.empty}>No projects yet. Create one above.</li>
        )}
        {projects.map((p) => (
          <li key={p.id} style={styles.item}>
            <Link to={`/project/${p.id}`} style={styles.itemLink}>
              <span style={styles.itemName}>{p.name}</span>
              <span style={styles.itemMeta}>
                {p.connection
                  ? `${p.connection.host}:${p.connection.port}`
                  : "No connection"}
              </span>
            </Link>
            <button
              type="button"
              onClick={(e) => handleDelete(p.id, e)}
              style={styles.deleteBtn}
              title="Delete project"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  msg: { padding: "2rem", color: "#94a3b8" },
  top: { marginBottom: "1.5rem" },
  title: { margin: "0 0 1rem 0", fontSize: "1.5rem" },
  form: { display: "flex", gap: "0.5rem", alignItems: "center" },
  input: {
    padding: "0.5rem 0.75rem",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#eaeaea",
    width: "220px",
  },
  btn: {
    padding: "0.5rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
  },
  list: { listStyle: "none", margin: 0, padding: 0 },
  empty: { color: "#64748b", padding: "1rem 0" },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    background: "#16213e",
    borderRadius: "8px",
    marginBottom: "0.5rem",
  },
  itemLink: { flex: 1, textDecoration: "none", color: "inherit" },
  itemName: { fontWeight: 600 },
  itemMeta: { display: "block", fontSize: "0.875rem", color: "#94a3b8" },
  deleteBtn: {
    padding: "0.25rem 0.5rem",
    background: "transparent",
    color: "#f87171",
    border: "1px solid #f87171",
    borderRadius: "4px",
    fontSize: "0.875rem",
  },
};
