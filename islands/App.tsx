import { StateUpdater, useEffect, useState } from "preact/hooks";
import { Opts } from "../global.ts";

export default function App() {
  const [url, setUrl] = useState("");
  const [ytOut, setYtOut] = useState("");
  const [fmts, setFmts] = useState<Opts[]>([]);
  const [meta, setMeta] = useState<{ name: string; img: string } | null>();
  const [directUrl, setDirectUrl] = useState("");
  const [ind, setInd] = useState("");
  const [id, setId] = useState(0);
  const [disableDown, setDisableDown] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // NOTE: using localhost has the nice effect
    // that it doesn't work on remote sites like replit
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id) {
        setId(data.id);
      } else if (data.data) {
        setYtOut(data.data);
      } else if (data.done) {
        setYtOut(`Downloaded to ${data.dirPath}`);
      }
    };
  }, []);

  const getFormats = async () => {
    setDisableDown(true);

    setYtOut("");
    setMeta(null);
    setDirectUrl("");

    setInd("Looking for video...");

    const { name, img, fmts } = await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({
        url,
        method: "format",
      }),
    }).then((r) => r.json());

    if (fmts) {
      setMeta({ name, img });
      setFmts(fmts);
    }

    setInd("");
    setDisableDown(false);
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="text-lg flex-col justify-center text-center">
        <input
          class="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-4 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
          value={url}
          placeholder="Enter url here"
        />
        <button
          disabled={downloading || disableDown}
          class="text-white rounded-md font-bold text-lg p-1"
          style={{
            backgroundColor: (downloading || disableDown) ? "grey" : "red",
            cursor: (downloading || disableDown) ? "default" : "pointer",
          }}
          onClick={getFormats}
        >
          Download
        </button>
        <p class="m-2 text-green-700">{ind}</p>
      </div>

      {meta && (
        <div>
          <Meta name={meta.name} img={meta.img} />
          <div class="grid grid-cols-4 gap-4 m-4">
            {fmts.map((opts) => (
              <Format
                id={id}
                opts={opts}
                url={url}
                setFmts={setFmts}
                setDirectUrl={setDirectUrl}
                downloading={downloading}
                setDownloading={setDownloading}
              />
            ))}
          </div>
        </div>
      )}
      {(downloading || ytOut) && (
        <textarea
          placeholder="loading..."
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
      {directUrl && (
        <a
          target="_blank"
          class="text-center text-lg text-blue-800"
          href={directUrl}
        >
          Direct Link
        </a>
      )}
    </div>
  );
}

function Format(
  { opts, url, setFmts, id, downloading, setDirectUrl, setDownloading }: {
    opts: Opts;
    url: string;
    id: number;
    setFmts: StateUpdater<Opts[]>;
    setDirectUrl: StateUpdater<string>;
    downloading: boolean;
    setDownloading: StateUpdater<boolean>;
  },
) {
  const triggerDownload = async () => {
    setDownloading(true);

    await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({
        url,
        code: opts.code,
        method: "getUrl",
      }),
    }).then((r) => r.text()).then(setDirectUrl);

    await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({
        url,
        code: opts.code,
        method: "download",
        id,
      }),
    }).then((r) => r.text());
    setDownloading(false);
  };
  return (
    <button
      disabled={downloading}
      style={{
        backgroundColor: downloading ? "grey" : "white",
        cursor: downloading ? "default" : "pointer",
      }}
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
