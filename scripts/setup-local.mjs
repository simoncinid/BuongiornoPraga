import { randomBytes, scryptSync } from "node:crypto";
import { writeFile, access } from "node:fs/promises";
const file = ".env.development.local";
try {
  await access(file);
  console.log("Configurazione locale già presente.");
} catch {
  const salt = randomBytes(16).toString("hex");
  const password = "PragaLocale!2026";
  const staff = [
    {
      email: "admin@freetourpraga.local",
      role: "admin",
      passwordHash: `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
    },
  ];
  await writeFile(
    file,
    `PLATFORM_STORAGE=local\nSESSION_SECRET=${randomBytes(48).toString("base64url")}\nSTAFF_USERS='${JSON.stringify(staff)}'\nNEXT_PUBLIC_SITE_URL=http://localhost:3100\n`,
    { mode: 0o600 },
  );
  console.log(
    "Ambiente locale pronto. Accesso: admin@freetourpraga.local / PragaLocale!2026 (solo sviluppo).",
  );
}
