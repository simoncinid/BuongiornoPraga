import crypto from "node:crypto";

const secret = process.env.PRETOUR_TOKEN_SECRET || "local-development-secret";

export function createSelfServiceToken(pnr: string, expiresAt: Date) {
  const payload = `${pnr}.${expiresAt.getTime()}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifySelfServiceToken(token: string) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [pnr, expires, signature] = raw.split(".");
    if (!pnr || !expires || !signature) return null;
    const payload = `${pnr}.${expires}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    if (Number(expires) < Date.now()) return null;
    return { pnr, expiresAt: new Date(Number(expires)) };
  } catch {
    return null;
  }
}
