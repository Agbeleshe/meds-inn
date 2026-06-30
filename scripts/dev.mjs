import { spawn } from "node:child_process";

// Start Vercel dev directly — the rewrites in vercel.json are now
// carefully crafted to ignore Vite's internal assets, so it works flawlessly
const dev = spawn("npx", ["vercel", "dev"], {
  stdio: "inherit",
  env: process.env,
});

dev.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => dev.kill("SIGINT"));
process.on("SIGTERM", () => dev.kill("SIGTERM"));
