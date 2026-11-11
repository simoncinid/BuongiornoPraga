import { spawn } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const base = new URL(
  process.env.DATABASE_URL ||
    `postgresql://${process.env.USER}@localhost:5432/postgres`,
);
if (!["localhost", "127.0.0.1"].includes(base.hostname))
  throw Error("Il collaudo produzione è consentito solo su PostgreSQL locale.");
base.pathname="/postgres";
const databaseName = `ftp_test_http_${randomBytes(6).toString("hex")}`;
const testUrl = new URL(base);
testUrl.pathname = "/" + databaseName;
const admin = new PrismaClient({
  datasources: { db: { url: base.toString() } },
});
const salt = randomBytes(16).toString("hex"),
  passwordHash = `${salt}:${scryptSync("PragaLocale!2026", salt, 64).toString("hex")}`;
const env = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: testUrl.toString(),
  PLATFORM_STORAGE: "postgres",
  NEXT_DIST_DIR: ".next-http",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3101",
  SESSION_SECRET: randomBytes(48).toString("base64url"),
  BOOKING_LINK_SECRET: randomBytes(48).toString("base64url"),
  STAFF_USERS: JSON.stringify([
    { email: "admin@freetourpraga.local", role: "admin", passwordHash },
    { email: "operator@freetourpraga.local", role: "operator", passwordHash },
  ]),
  STRIPE_SECRET_KEY: "",
  SMTP_HOST: "",
  IMAP_HOST: "",
  TWILIO_CONTENT_SID: "",
  CRON_SECRET: randomBytes(32).toString("hex"),
};
async function run(command, args, childEnv = env) {
  await new Promise((resolve, reject) => {
    const p = spawn(command, args, { env: childEnv, stdio: "inherit" });
    p.once("error", reject);
    p.once("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`${command} ${args[0]}: ${code}`)),
    );
  });
}
let server,
  created = false;
try {
  await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
  created = true;
  await run(process.execPath, [
    "node_modules/prisma/build/index.js",
    "migrate",
    "deploy",
  ]);
  await run("npm", ["run", "build"]);
  server=spawn(process.execPath,['.next-http/standalone/server.js'],{env:{...env,PORT:'3101',HOSTNAME:'127.0.0.1'},detached:true,stdio:['ignore','inherit','inherit']});
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw Error("Server produzione QA terminato");
    try {
      if (
        (
          await fetch("http://localhost:3101/api/platform/health", {
            signal: AbortSignal.timeout(1500),
          })
        ).ok
      ) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw Error("Server produzione QA non disponibile");
  const testEnv = {
    ...process.env,
    TEST_URL: "http://localhost:3101",
    HTTP_TEST_PRODUCTION: "1",
  };
  await run(process.execPath, ["scripts/http-smoke.mjs"], testEnv);
  await run(process.execPath, ["scripts/http-e2e.mjs"], testEnv);
  console.log(
    "PASS: production build + isolated PostgreSQL + complete HTTP workflows. External services disabled.",
  );
} finally {
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (created)
    await admin.$executeRawUnsafe(
      `DROP DATABASE "${databaseName}" WITH (FORCE)`,
    );
  await admin.$disconnect();
}
