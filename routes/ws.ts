import { Handlers } from "$fresh/server.ts";

interface TagedSocket {
  id: number;
  socket: WebSocket;
}
export const activeSockets: TagedSocket[] = [];
export const getSocketById = (id: number) =>
  activeSockets.find((as) => as.id == id)?.socket;

let id = 0;
export const handler: Handlers = {
  GET(req) {
    id++;
    let response, socket: WebSocket;
    try {
      ({ response, socket } = Deno.upgradeWebSocket(req));
    } catch {
      return new Response("request isn't trying to upgrade to websocket.");
    }
    socket.onopen = () => {
      socket.send(JSON.stringify({ id: id }));
    };

    activeSockets.push({ id: id, socket });
    return response;
  },
};
