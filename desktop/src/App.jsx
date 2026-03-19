import { Routes, Route, Link } from "react-router-dom";
import ProjectList from "./pages/ProjectList";
import ProjectView from "./pages/ProjectView";

export default function App() {
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>
          MC-Bot
        </Link>
      </header>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
        </Routes>
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "0.75rem 1.5rem",
    background: "#16213e",
    borderBottom: "1px solid #0f3460",
  },
  logo: {
    color: "#eaeaea",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "1.25rem",
  },
  main: {
    flex: 1,
    padding: "1.5rem",
    overflow: "auto",
  },
};
