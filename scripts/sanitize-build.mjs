import { readdir, rm,cp } from "node:fs/promises";
import { join } from "node:path";
// Next standalone copies loaded .env files explicitly, outside output tracing.
// Strip them from the generated artifact; never modify the source environment.
const buildDir=process.env.NEXT_DIST_DIR||".next";
const root = join(buildDir,"standalone");
let removed = 0;
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return;
    throw e;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isFile() && /^\.env(?:\.|$)/.test(entry.name)) {
      await rm(path);
      removed++;
    } else if (entry.isDirectory()) await walk(path);
  }
}
await walk(root);
console.log(
  `Standalone artifact sanitized (${removed} environment files removed).`,
);

await cp(join(buildDir,"static"),join(root,buildDir,"static"),{recursive:true});
await cp("public",join(root,"public"),{recursive:true});
console.log("Standalone static assets and font licenses prepared.");
