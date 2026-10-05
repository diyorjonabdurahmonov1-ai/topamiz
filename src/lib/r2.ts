import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible — same SDK, just a different endpoint and
// zero egress fees, which is the whole reason listing videos live here
// instead of on the VPS's own disk/bandwidth (see AGENTS.md).
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    BUCKET &&
    R2_PUBLIC_URL
  );
}

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(url: string): Promise<void> {
  if (!url.startsWith(R2_PUBLIC_URL)) return;
  const key = url.slice(R2_PUBLIC_URL.length + 1);
  if (!key) return;
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
