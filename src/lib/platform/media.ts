import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { HttpError, requireStaff, checkOrigin } from "./security";
import { localMode } from "./store";
export async function uploadMedia(request: Request) {
  await requireStaff(["admin"]);
  checkOrigin(request);
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(
      request.headers.get("content-type") || "",
    )
  )
    throw new HttpError(400, "Usa immagini JPEG, PNG o WebP");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Immagine assente");
  let length = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 5 * 1024 * 1024) {
      await reader.cancel();
      throw new HttpError(413, "Immagine troppo grande: massimo 5 MB");
    }
    chunks.push(value);
  }
  let image: Buffer;
  try {
    image = await sharp(Buffer.concat(chunks), { limitInputPixels: 40000000 })
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    throw new HttpError(400, "Immagine non valida");
  }
  const key = `${randomUUID()}.webp`;
  if (localMode()) {
    await mkdir(".data/media", { recursive: true });
    await writeFile(`.data/media/${key}`, image, { mode: 0o600 });
    return { url: `/api/media/${key}` };
  }
  if (
    !process.env.MEDIA_BUCKET ||
    !process.env.MEDIA_PUBLIC_BASE ||
    !process.env.SPACES_ENDPOINT ||
    !process.env.MEDIA_ACCESS_KEY_ID ||
    !process.env.MEDIA_SECRET_ACCESS_KEY
  )
    throw new HttpError(503, "Archivio immagini non configurato");
  const client = new S3Client({
    region: "us-east-1",
    endpoint: process.env.SPACES_ENDPOINT,
    credentials: {
      accessKeyId: process.env.MEDIA_ACCESS_KEY_ID,
      secretAccessKey: process.env.MEDIA_SECRET_ACCESS_KEY,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.MEDIA_BUCKET,
      Key: `tour/${key}`,
      Body: image,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
      ACL: "public-read",
    }),
  );
  return {
    url: `${process.env.MEDIA_PUBLIC_BASE.replace(/\/$/, "")}/tour/${key}`,
  };
}
