import { Handlers } from "$fresh/server.ts";
import download_dir from "https://deno.land/x/dir@1.5.1/download_dir/mod.ts";
import { ensureDir } from "https://deno.land/std@0.152.0/fs/ensure_dir.ts";

export const DOWNLOAD_DIR = (download_dir() || ".") + "/ytf";
await ensureDir(DOWNLOAD_DIR);

export const handler: Handlers = {
  GET() {
    return new Response(DOWNLOAD_DIR);
  },
};
