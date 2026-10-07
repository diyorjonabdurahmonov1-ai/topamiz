import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { finishUpload, getUploadSession, writeChunk } from "@/lib/video-uploads";

async function sessionFor(ctx: RouteContext<"/api/upload-video/[id]">) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 }) };
  const { id } = await ctx.params;
  const session = getUploadSession(id, user.id);
  if (!session) {
    return {
      error: NextResponse.json({ error: "Yuklash topilmadi. Videoni qaytadan tanlang." }, { status: 404 }),
    };
  }
  return { session };
}

// One chunk of the file, at the byte offset given in the query string.
export async function PUT(request: Request, ctx: RouteContext<"/api/upload-video/[id]">) {
  const { session, error } = await sessionFor(ctx);
  if (error) return error;

  const offset = Number(new URL(request.url).searchParams.get("offset"));
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: "Bo'lak tartibi buzildi" }, { status: 400 });
  }

  const data = Buffer.from(await request.arrayBuffer());
  const problem = await writeChunk(session, offset, data);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  return NextResponse.json({ received: session.received });
}

// All chunks are in — kick off compression in the background.
export async function POST(_request: Request, ctx: RouteContext<"/api/upload-video/[id]">) {
  const { session, error } = await sessionFor(ctx);
  if (error) return error;

  const problem = await finishUpload(session);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  return NextResponse.json({ status: session.status }, { status: 202 });
}

export async function GET(_request: Request, ctx: RouteContext<"/api/upload-video/[id]">) {
  const { session, error } = await sessionFor(ctx);
  if (error) return error;

  return NextResponse.json({
    status: session.status,
    videoUrl: session.videoUrl ?? null,
    thumbnailUrl: session.thumbnailUrl ?? null,
    error: session.error ?? null,
  });
}
