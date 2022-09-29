import { StateUpdater, useEffect, useState } from "preact/hooks";

export default function App() {
  const [url, setUrl] = useState("");
  const [ytOut, setYtOut] = useState("");
  const [fmts, setFmts] = useState<Opts[]>([]);

  useEffect(() => {
    setInterval(async () => {
      const line = await fetch("/api/download").then((r) => r.text());
      if (!line) return;
      setYtOut(line);
    }, 100);
  }, []);

  const download = async () => {
    const fmts = await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({
        url,
        method: "format",
      }),
    }).then((r) => r.json());
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
        focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
      "
          onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
          value={url}
          placeholder="Enter url here"
        />
        <button class="bg-red-600 text-white rounded-md" onClick={download}>
          Download
        </button>
      </div>
      <ul>
        {fmts.map((opts) => (
          <Format
            opts={opts}
            url={url}
            setFmts={setFmts}
          />
        ))}
      </ul>
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
    </div>
  );
}

export interface Opts {
  code: number;
  ext: string;
  res: string;
}

function Format(
  { opts, url, setFmts }: {
    opts: Opts;
    url: string;
    setFmts: StateUpdater<Opts[]>;
  },
) {
  const f = async () => {
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
    <div>
      <button onClick={f}>{opts.ext} {opts.res}</button>
    </div>
  );
}
