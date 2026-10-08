// Shrinks a phone video on the device before it's uploaded, the way
// Instagram does: a 60MB clip typically becomes ~8–10MB, so it uploads in a
// fraction of the time, and the server only has to repackage it instead of
// re-encoding. Uses the phone's own hardware encoder via WebCodecs.
//
// Returns null whenever compressing isn't possible or isn't worth it (no
// WebCodecs, a codec the phone can't decode, already small, or it simply
// failed) — the caller then uploads the original file, which the server
// compresses instead. So this can only ever make an upload faster, never
// break it.

const MIN_SIZE_TO_COMPRESS = 8 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const VIDEO_BITRATE = 2_500_000;
const AUDIO_BITRATE = 128_000;
const STALL_TIMEOUT_MS = 20_000;

export async function compressVideo(
  file: Blob,
  onProgress: (fraction: number) => void,
  isCancelled: () => boolean
): Promise<Blob | null> {
  if (file.size < MIN_SIZE_TO_COMPRESS) return null;
  if (typeof VideoEncoder === "undefined" || typeof VideoDecoder === "undefined") return null;

  try {
    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      Conversion,
      Input,
      Mp4OutputFormat,
      Output,
      canEncodeAudio,
      canEncodeVideo,
    } = await import("mediabunny");

    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    const track = await input.getPrimaryVideoTrack();
    if (!track) return null;

    const landscape = track.displayWidth >= track.displayHeight;
    const longest = Math.max(track.displayWidth, track.displayHeight);
    const size =
      longest > MAX_DIMENSION
        ? landscape
          ? { width: MAX_DIMENSION }
          : { height: MAX_DIMENSION }
        : {};
    // H.264 lets the server skip re-encoding entirely; VP9 is the fallback
    // for browsers without an H.264 encoder — still a far smaller upload,
    // and the server converts it.
    const videoCodec = (await canEncodeVideo("avc", { bitrate: VIDEO_BITRATE }))
      ? "avc"
      : (await canEncodeVideo("vp9", { bitrate: VIDEO_BITRATE }))
        ? "vp9"
        : null;
    if (!videoCodec) return null;
    const audioCodec = (await canEncodeAudio("aac", { bitrate: AUDIO_BITRATE })) ? "aac" : "opus";

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget(),
    });
    const conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      video: { codec: videoCodec, bitrate: VIDEO_BITRATE, ...size },
      audio: { codec: audioCodec, bitrate: AUDIO_BITRATE },
      showWarnings: false,
    });
    if (!conversion.isValid) return null;

    // Some phones' decoders stall instead of erroring — if no progress is
    // made for a while, give up and upload the original instead.
    let lastProgressAt = Date.now();
    conversion.onProgress = (fraction) => {
      lastProgressAt = Date.now();
      if (isCancelled()) void conversion.cancel();
      else onProgress(fraction);
    };
    const watchdog = setInterval(() => {
      if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) void conversion.cancel();
    }, 1000);
    try {
      await conversion.execute();
    } finally {
      clearInterval(watchdog);
    }

    const buffer = output.target.buffer;
    if (!buffer || isCancelled()) return null;
    // Only worth it if it actually saved a meaningful amount.
    if (buffer.byteLength > file.size * 0.8) return null;
    return new Blob([buffer], { type: "video/mp4" });
  } catch {
    return null;
  }
}
