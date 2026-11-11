import { randomBytes, scryptSync } from "node:crypto";
// Password arrives over stdin, never command-line arguments or environment logs.
let input = "";
for await (const chunk of process.stdin) input += chunk;
const password = input.trim();
if (password.length < 14) throw Error("Usa almeno 14 caratteri.");
const salt = randomBytes(16).toString("hex");
console.log(`${salt}:${scryptSync(password, salt, 64).toString("hex")}`);
