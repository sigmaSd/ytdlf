/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

const ready = (addr: { hostname: string; port: number }) => {
  if (typeof self.postMessage === "function") {
    self.postMessage("ready");
  }
  console.log(`Listening on http://${addr.hostname}:${addr.port}/`);
};

await start(manifest, {
  plugins: [twindPlugin(twindConfig)],
  onListen: ready,
});
