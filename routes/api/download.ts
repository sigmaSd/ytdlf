import { Handlers } from "$fresh/server.ts";
import { Opts } from "../../global.ts";
import { activeSockets, getSocketById } from "../ws.ts";

import download_dir from "https://deno.land/x/dir@1.5.1/download_dir/mod.ts";
import { ensureDir } from "https://deno.land/std@0.152.0/fs/ensure_dir.ts";

export const DOWNLOAD_DIR = (download_dir() || ".") + "/ytf";
await ensureDir(DOWNLOAD_DIR);

class LogStream extends WritableStream<string> {
  constructor(yt: Deno.Child, id: number) {
    super({
      write(chunk) {
        try {
          getSocketById(id)?.send(
            JSON.stringify({ data: LogStream.clean(chunk) }),
          );
        } catch {
          // client probably closed the page
          // stop yt
          yt.kill();
        }
      },
    });
    yt.status.then(() => {
      try {
        getSocketById(id)?.send(
          JSON.stringify({ done: true, dirPath: DOWNLOAD_DIR }),
        );
      } catch { /*client exited*/ }
    });
  }
  static clean(s: string): string {
    return s.replaceAll("\r\x1b[K", "");
  }
}

const getUrl = async ({ url, code }: { url: string; code: number }) => {
  return new TextDecoder().decode(
    await Deno.spawn("youtube-dl", {
      args: [url, "-f", code.toString(), "-g"],
      stdout: "piped",
      stderr: "inherit",
    }).then((r) => r.stdout),
  );
};

const download = async (
  { url, id, code }: { url: string; id: number; code: number },
) => {
  if (activeSockets.length === 0) {
    // Can happen on remote sites like replit
    // Don't bother downloading
    return new Response();
  }
  const yt = Deno.spawnChild("youtube-dl", {
    args: [
      url,
      "-f",
      code.toString(),
      "-o",
      "%(title)s-%(format)s.%(ext)s",
      "--no-part",
    ],
    stdout: "piped",
    stderr: "inherit",
    cwd: DOWNLOAD_DIR,
  });
  await yt.stdout.pipeThrough(new TextDecoderStream()).pipeTo(
    new LogStream(yt, id),
  );
};

const getFormats = async (url: string) => {
  if (!url) return new Response("");
  const [meta, rawFmt] = await Promise.all([
    Deno.spawn("youtube-dl", {
      args: ["-e", "--get-thumbnail", url],
      stdout: "piped",
    }).then((r) => new TextDecoder().decode(r.stdout).split("\n")),

    Deno.spawn("youtube-dl", {
      args: ["-F", url],
      stdout: "piped",
    }).then((r) => new TextDecoder().decode(r.stdout).split("\n")),
  ]);

  const res: Opts[] = [];

  const lines = rawFmt;

  const s = lines.findIndex((v) => v.startsWith("format"));
  if (!s) return new Response("");
  for (const line of lines.slice(s + 1)) {
    if (!line) continue;
    const parts = line.split(/\s+/);

    const fmt = {
      code: parseInt(parts[0]),
      ext: parts[1],
      res: parts[2],
    };
    if (line.includes("video only")) {
      // NOTE: is this actually useful?
      continue;
    }
    if (res.find((e) => e.ext == fmt.ext && e.res == fmt.res)) {
      continue;
    }
    res.push(fmt);
  }

  return { name: meta[0], img: meta[1], fmts: res };
};

export const handler: Handlers = {
  async POST(req) {
    const { url, id, code, method } = await req.json();

    switch (method) {
      case "getUrl": {
        if (!code || !url) {
          return error500;
        }
        const directUrl = await getUrl({ url, code });
        return new Response(directUrl);
      }
      case "format": {
        if (!url) {
          return error500;
        }
        const formats = await getFormats(url);
        return new Response(
          JSON.stringify(formats),
        );
      }
      case "download": {
        if (!id || !url || !code) {
          return error500;
        }
        await download({ id, url, code });
        return new Response();
      }
      default:
        console.error("Unkown method: ", method);
        return error500;
    }
  },
};

const error500 = new Response("", { status: 500 });
