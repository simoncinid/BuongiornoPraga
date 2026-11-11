import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
const temp = await mkdtemp(join(tmpdir(), "freetour-http-"));
const salt = randomBytes(16).toString("hex");
const env = {
  ...process.env,
  PLATFORM_STORAGE: "local",
  PLATFORM_DATA_FILE: join(temp, "state.json"),
  NEXT_PUBLIC_SITE_URL: "http://localhost:3101",
  NEXT_DIST_DIR: ".next-qa",
  SESSION_SECRET: randomBytes(48).toString("base64url"),
  STAFF_USERS: JSON.stringify([
    {
      email: "admin@freetourpraga.local",
      role: "admin",
      passwordHash: `${salt}:${scryptSync("PragaLocale!2026", salt, 64).toString("hex")}`,
    },
    {
      email: "operator@freetourpraga.local",
      role: "operator",
      passwordHash: `${salt}:${scryptSync("PragaLocale!2026", salt, 64).toString("hex")}`,
    },
  ]),
  STRIPE_SECRET_KEY: "",
  SMTP_HOST: "",
  IMAP_HOST: "",
  TWILIO_CONTENT_SID: "",
  CRON_SECRET: randomBytes(32).toString("hex"),
};
let logs = "";
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--webpack", "--port", "3101"],
  { env, detached: true, stdio: ["ignore", "pipe", "pipe"] },
);
server.stdout.on("data", (d) => {
  logs = (logs + d.toString()).slice(-12000);
});
server.stderr.on("data", (d) => {
  logs = (logs + d.toString()).slice(-12000);
});
async function run(script) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      env: { ...process.env, TEST_URL: "http://localhost:3101" },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`${script} failed: ${code}`)),
    );
  });
}
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw Error("Server QA terminato");
    try {
      const r = await fetch("http://localhost:3101/api/platform/health", {
        signal: AbortSignal.timeout(1000),
      });
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw Error("Server QA non disponibile");
  await run("scripts/http-smoke.mjs");
  await run("scripts/http-e2e.mjs");
} catch (e) {
  console.error(logs);
  throw e;
} finally {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
  await rm(temp, { recursive: true, force: true });
}
