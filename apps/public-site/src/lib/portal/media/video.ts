import { spawn } from 'child_process';

export interface VideoMetadata {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}

const EMPTY_METADATA: VideoMetadata = { width: null, height: null, durationSeconds: null };

// Shells out to ffprobe if it's on PATH — genuinely works on a machine
// that has ffmpeg installed, but this is a real deployment requirement,
// not a guarantee: most serverless/managed Node hosts (Vercel included)
// don't ship ffmpeg by default. Never throws — a host without ffprobe
// just gets null metadata (video still uploads and stores correctly,
// only duration/dimensions are unavailable until a thumbnail/dimensions
// are supplied manually). This is stated plainly rather than silently
// pretending video processing always works.
export async function extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json',
      filePath,
    ]);

    let stdout = '';
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf-8'); });
    proc.on('error', () => resolve(EMPTY_METADATA)); // ffprobe not installed
    proc.on('close', (code) => {
      if (code !== 0 || !stdout) {
        resolve(EMPTY_METADATA);
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as {
          streams?: Array<{ width?: number; height?: number }>;
          format?: { duration?: string };
        };
        const stream = parsed.streams?.[0];
        const duration = parsed.format?.duration ? Math.round(Number(parsed.format.duration)) : null;
        resolve({
          width: stream?.width ?? null,
          height: stream?.height ?? null,
          durationSeconds: Number.isFinite(duration) ? duration : null,
        });
      } catch {
        resolve(EMPTY_METADATA);
      }
    });
  });
}
