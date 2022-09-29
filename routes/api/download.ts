import { Handlers } from "$fresh/server.ts";
import { Opts } from "../../global.ts";
import { DOWNLOAD_DIR } from "./downloadDir.ts";

class LogSink implements UnderlyingSink<string> {
  #value: string[] = [];
  write?: UnderlyingSinkWriteCallback<string> | undefined = (chunk) => {
    this.#value.push(chunk);
  };
  read() {
    return this.#value;
  }
  popFront() {
    return this.#value.shift();
  }
  push(s: string) {
    this.#value.push(s);
  }
}
class LogStream extends WritableStream<string> {
  #sink: LogSink;
  constructor(sink: LogSink) {
    super(sink);
    this.#sink = sink;
  }
  read() {
    return this.#sink.read();
  }
  popFront() {
    return this.#sink.popFront();
  }
  push(s: string) {
    this.#sink.push(s);
  }
}

let out: LogStream | null = null;

let activeYt: Deno.Child | null = null;

export const handler: Handlers = {
  async POST(req) {
    const { url, code, method } = await req.json();

    if (method == "download") {
      activeYt = null;
      out = new LogStream(new LogSink());

      activeYt = Deno.spawnChild("youtube-dl", {
        args: [url, "-f", code, "-o", "%(title)s-%(format)s.%(ext)s"],
        stdout: "piped",
        stderr: "inherit",
        cwd: DOWNLOAD_DIR,
      });
      await activeYt.stdout.pipeThrough(new TextDecoderStream()).pipeTo(out);
      activeYt.status.then(() => out!.push("DONE"));

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
      throw "unkown method";
    }
  },
  GET() {
    if (!out) return new Response("");
    const line = out.popFront();
    if (!line) return new Response("");
    return new Response(line);
  },
};
