import { Room } from "./room.ts";

interface Environment {
  ROOMS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

const ROOM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default {
  async fetch(request: Request, environment: Environment): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/config") {
      return Response.json(
        { publicUrl: url.origin },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const role = url.searchParams.get("role");
    if (url.pathname !== "/" || (role !== "host" && role !== "player")) {
      return environment.ASSETS.fetch(request);
    }
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket required", { status: 426 });
    }
    const room = role === "host" ? crypto.randomUUID() : url.searchParams.get("room");
    if (!room || !ROOM_ID.test(room))
      return new Response("Session unavailable", { status: 400 });
    url.searchParams.set("room", room);
    const roomId = environment.ROOMS.idFromName(room);
    return environment.ROOMS.get(roomId).fetch(new Request(url, request));
  },
};

export { Room };
