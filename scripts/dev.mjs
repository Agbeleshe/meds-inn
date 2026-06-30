import { spawn } from "node:child_process";

// Start Vercel dev API server
const api = spawn("npm", ["run", "dev:api"], {
  stdio: "inherit",
  env: process.env,
});

// Start Vite UI server
const ui = spawn("npm", ["run", "dev:ui"], {
  stdio: "inherit",
  env: process.env,
});

function cleanup(code) {
  api.kill();
  ui.kill();
  process.exit(code ?? 0);
}

api.on("exit", cleanup);
ui.on("exit", cleanup);

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));
