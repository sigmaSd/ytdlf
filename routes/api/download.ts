import { Handlers } from "$fresh/server.ts";
import { Opts } from "../../islands/App.tsx";

class O implements UnderlyingSink<string> {
  #value: string[] = [];
  write?: UnderlyingSinkWriteCallback<string> | undefined = (chunk) => {
    console.log("writing: ", chunk);
    this.#value.push(chunk);
  };
  read() {
    return this.#value;
  }
  popFront() {
    return this.#value.shift();
  }
}
class Z extends WritableStream<string> {
  #sink: O;
  constructor(sink: O) {
    super(sink);
    this.#sink = sink;
  }
  read() {
    return this.#sink.read();
  }
  popFront() {
    return this.#sink.popFront();
  }
}

const out = new Z(new O());
// async function a() {
//   while (true) {
//     await new Promise((r) => setTimeout(r, 1000));
//     console.log("out is: ", out.read());
//   }
// }
// a();

export const handler: Handlers = {
  async POST(req) {
    const { url, code, method } = await req.json();
    console.log(method);

    if (method == "download") {
      const p = Deno.spawnChild("youtube-dl", {
        args: [url, "-f", code],
        stdout: "piped",
        stderr: "inherit",
      });
      p.ref();
      await p.stdout.pipeThrough(new TextDecoderStream()).pipeTo(out);

      return new Response("");
    } else if (method == "format") {
      const raw = await Deno.spawn("youtube-dl", {
        args: ["-F", url],
        stdout: "piped",
      }).then((r) => r.stdout);

      const res: Opts[] = [];

      const lines = new TextDecoder().decode(raw).split("\n");

      const s = lines.findIndex((v) => v.startsWith("format"));
      for (const line of lines.slice(s + 1)) {
        if (!line) continue;
        const parts = line.split(/\s+/);

        res.push({
          code: parseInt(parts[0]),
          ext: parts[1],
          res: parts[2],
        });
      }
      console.log(res);

      return new Response(JSON.stringify(res));
    } else {
      throw "unkown method";
    }
  },
  GET() {
    const line = out.popFront();
    if (!line) return new Response("");
    return new Response(line);
  },
};
