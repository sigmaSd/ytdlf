import { StateUpdater, useEffect, useState } from "preact/hooks";
import { Opts } from "../global.ts";

export default function App() {
  const [url, setUrl] = useState("");
  const [ytOut, setYtOut] = useState("");
  const [fmts, setFmts] = useState<Opts[]>([]);
  const [meta, setMeta] = useState<{ name: string; img: string } | null>();

  useEffect(() => {
    setInterval(async () => {
      const line = await fetch("/api/download").then((r) => r.text());
      if (!line) return;
      if (line == "DONE") {
        const downloadDir = await fetch("/api/downloadDir").then((r) =>
          r.text()
        );
        setYtOut("Downloaded video to: " + downloadDir);
      } else {
        setYtOut(line);
      }
    }, 100);
  }, []);

  const getFormats = async () => {
    setYtOut("");
    setMeta(null);

    const { name, img, fmts } = await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({
        url,
        method: "format",
      }),
    }).then((r) => r.json());
    setMeta({ name, img });
    setFmts(fmts);
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="text-lg flex-col justify-center text-center">
        <input
          class="
        form-control
        block
        w-full
        px-3
        py-1.5
        text-base
        font-normal
        text-gray-700
        bg-white bg-clip-padding
        border border-solid border-gray-300
        rounded
        transition
        ease-in-out
        m-4
        focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
          value={url}
          placeholder="Enter url here"
        />
        <button
          class="bg-red-600 text-white rounded-md font-bold text-lg"
          onClick={getFormats}
        >
          Download
        </button>
      </div>

      {meta && (
        <div>
          <Meta name={meta.name} img={meta.img} />
          <div class="grid grid-cols-4 gap-4">
            {fmts.map((opts) => (
              <Format
                opts={opts}
                url={url}
                setFmts={setFmts}
              />
            ))}
          </div>
        </div>
      )}
      {ytOut && (
        <textarea
          class="border-black border m-4 text-center text-lg"
          readonly={true}
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck={false}
          value={ytOut}
        >
        </textarea>
      )}
    </div>
  );
}

function Format(
  { opts, url, setFmts }: {
    opts: Opts;
    url: string;
    setFmts: StateUpdater<Opts[]>;
  },
) {
  const triggerDownload = async () => {
    setFmts([]);
    await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({
        url,
        code: opts.code,
        method: "download",
      }),
    });
  };
  return (
    <button
      class="border border-blue-600 rounded-md text-lg text-red-800 font-bold"
      onClick={triggerDownload}
    >
      {opts.ext} {opts.res}
    </button>
  );
}

function Meta({ name, img }: { name: string; img: string }) {
  return (
    <div class="flex  justify-center gap-4 m-4">
      <h2 class="text-lg font-bold">{name}</h2>
      <img class="w-72" src={img} />
    </div>
  );
}
