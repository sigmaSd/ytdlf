import { SizeHint, Webview } from "https://deno.land/x/webview@0.7.5/mod.ts";
import { dirname, join } from "https://deno.land/std@0.158.0/path/mod.ts";

const worker = new Worker(
  join(dirname(import.meta.url), "main.ts"),
  { type: "module" },
);

const webview = new Webview();

webview.navigate("http://localhost:8000/");
webview.run();

worker.terminate();
