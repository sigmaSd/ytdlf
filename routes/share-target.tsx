import { Handlers, PageProps } from "$fresh/server.ts";
import App from "../islands/App.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url).searchParams.get("text");
    const resp = await ctx.render({ url });
    return resp;
  },
};

export default function Page({ data }: PageProps<{ url: string } | null>) {
  if (!data) {
    return <h1>User not found</h1>;
  }

  return <App preSelectedUrl={data.url} />;
}
