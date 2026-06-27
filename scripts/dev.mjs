import { spawn } from "node:child_process";

const child = spawn("npx", ["vercel", "dev", "--listen", "5173"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
