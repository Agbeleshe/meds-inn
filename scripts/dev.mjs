import { spawn } from "node:child_process";

// Start the Vercel dev server (API only) on port 5174
const api = spawn(
  "npx",
  ["vercel", "dev", "--listen", "5174"],
  { stdio: "inherit", env: { ...process.env, PORT: "5174" } },
);

// Start Vite directly on port 5173 — no vercel routing, no catch-all interference
const vite = spawn(
  "npx",
  ["vite", "--host", "127.0.0.1", "--port", "5173"],
  { stdio: "inherit", env: process.env },
);

function kill() {
  api.kill();
  vite.kill();
}

api.on("exit", (code) => { vite.kill(); process.exit(code ?? 0); });
vite.on("exit", (code) => { api.kill(); process.exit(code ?? 0); });
process.on("SIGINT", kill);
process.on("SIGTERM", kill);
