import { Handlers } from "$fresh/server.ts";
import { Opts } from "../../global.ts";
import { activeSockets, getSocketById } from "../ws.ts";

import download_dir from "https://deno.land/x/dir@1.5.1/download_dir/mod.ts";
import { ensureDir } from "https://deno.land/std@0.152.0/fs/ensure_dir.ts";

export const DOWNLOAD_DIR = (download_dir() || ".") + "/ytf";
await ensureDir(DOWNLOAD_DIR);

class LogStream extends WritableStream<string> {
  constructor(id: number) {
    super({
      write(chunk) {
        getSocketById(id)?.send(
          JSON.stringify({ data: chunk }),
        );
      },
    });
  }
}

export const handler: Handlers = {
  async POST(req) {
    const { url, id, code, method } = await req.json();

    if (method == "getUrl") {
      const directUrl = new TextDecoder().decode(
        await Deno.spawn("youtube-dl", {
          args: [url, "-f", code, "-g"],
          stdout: "piped",
          stderr: "inherit",
        }).then((r) => r.stdout),
      );
      return new Response(directUrl);
    } else if (method == "download") {
      if (activeSockets.length === 0) {
        // Can happen on remote sites like replit
        // Don't bother downloading
        return new Response();
      }
      const yt = Deno.spawnChild("youtube-dl", {
        args: [url, "-f", code, "-o", "%(title)s-%(format)s.%(ext)s"],
        stdout: "piped",
        stderr: "inherit",
        cwd: DOWNLOAD_DIR,
      });
      await yt.stdout.pipeThrough(new TextDecoderStream()).pipeTo(
        new LogStream(id),
      );
      yt.status.then(() =>
        getSocketById(id)?.send(
          JSON.stringify({ done: true, dirPath: DOWNLOAD_DIR }),
        )
      );

      return new Response();
    } else if (method == "format") {
      if (!url) return new Response("");
      const meta = new TextDecoder().decode(
        await Deno.spawn("youtube-dl", {
          args: ["-e", "--get-thumbnail", url],
          stdout: "piped",
        }).then((r) => r.stdout),
      ).split("\n");

      const raw = await Deno.spawn("youtube-dl", {
        args: ["-F", url],
        stdout: "piped",
      }).then((r) => r.stdout);

      const res: Opts[] = [];

      const lines = new TextDecoder().decode(raw).split("\n");

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
        if (res.find((e) => e.ext == fmt.ext && e.res == fmt.res)) {
          continue;
        }
        res.push(fmt);
      }
      return new Response(
        JSON.stringify({ name: meta[0], img: meta[1], fmts: res }),
      );
    } else {
      throw "unkown method: " + method;
    }
  },
};
