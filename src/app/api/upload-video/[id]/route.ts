import { NextResponse } from "next/server";
import { apiError, apiErrorText } from "@/lib/api-errors";
import { getCurrentUser } from "@/lib/auth";
import { finishUpload, getUploadSession, writeChunk } from "@/lib/video-uploads";

async function sessionFor(ctx: RouteContext<"/api/upload-video/[id]">) {
  const user = await getCurrentUser();
  if (!user) return { error: await apiError("signInRequired", 401) };
  const { id } = await ctx.params;
  const session = getUploadSession(id, user.id);
  if (!session) {
    return {
      error: await apiError("uploadNotFound", 404),
    };
  }
  return { session };
}

// One chunk of the file, at the byte offset given in the query string.
export async function PUT(request: Request, ctx: RouteContext<"/api/upload-video/[id]">) {
  const { session, error } = await sessionFor(ctx);
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const offset = Number(params.get("offset"));
  const length = Number(params.get("length"));
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(length)) {
    return await apiError("chunkProblem", 400);
  }

  let data: Buffer;
  try {
    data = Buffer.from(await request.arrayBuffer());
  } catch {
    return await apiError("chunkProblem", 409);
  }
  const result = await writeChunk(session, offset, length, data);
  if (result === "invalid") return await apiError("chunkProblem", 400);
  if (result === "incomplete") return await apiError("chunkProblem", 409);
  return NextResponse.json({ received: session.received });
}

// All chunks are in — kick off compression in the background.
export async function POST(request: Request, ctx: RouteContext<"/api/upload-video/[id]">) {
  const { session, error } = await sessionFor(ctx);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const size = typeof body?.size === "number" && Number.isInteger(body.size) ? body.size : 0;
  const problem = await finishUpload(session, size);
  if (problem) return await apiError(problem, 400);
  return NextResponse.json({ status: session.status }, { status: 202 });
}

export async function GET(_request: Request, ctx: RouteContext<"/api/upload-video/[id]">) {
  const { session, error } = await sessionFor(ctx);
  if (error) return error;

  return NextResponse.json({
    status: session.status,
    videoUrl: session.videoUrl ?? null,
    thumbnailUrl: session.thumbnailUrl ?? null,
    error: session.error ? await apiErrorText(session.error) : null,
  });
}
