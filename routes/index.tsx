import App from "../islands/App.tsx";
import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <div>
      <Head>
        <link rel="manifest" href="/pwa/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

      </Head>
      <script defer src="/pwa/app.js" />
      <App />;
    </div>
  );
}
