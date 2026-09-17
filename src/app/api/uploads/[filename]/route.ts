import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/uploads/[filename]">
) {
  const { filename } = await ctx.params;
  // path.basename strips any directory components so this can't escape UPLOAD_DIR
  const safeName = path.basename(filename);
  const ext = safeName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(UPLOAD_DIR, safeName));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
}
