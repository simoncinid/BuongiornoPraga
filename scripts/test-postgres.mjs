import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const name = `ftp_test_${randomBytes(6).toString("hex")}`;
function run(cmd, args, env = process.env) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env });
  if (r.status !== 0) throw Error(`${cmd}: ${r.status}`);
}
run("createdb", [name]);
try {
  const env = {
    ...process.env,
    DATABASE_URL: `postgresql://${process.env.USER}@localhost:5432/${name}`,
    PLATFORM_STORAGE: "postgres",
    TEST_POSTGRES: "1",
  };
  run("npx", ["prisma", "migrate", "deploy"], env);
  run("npm", ["test"], env);
} finally {
  run("dropdb", [name]);
}
