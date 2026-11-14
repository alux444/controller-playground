import { createServer, type RequestListener } from "node:http";
import { createServer as createSecureServer } from "node:https";
import { randomBytes, randomUUID } from "node:crypto";
import { networkInterfaces } from "node:os";
import { readFile, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import { parseControllerState } from "./protocol.ts";

interface Room {
  host: WebSocket;
  players: Map<WebSocket, { id: string; slot?: number }>;
}

const port = Number(process.env.PORT ?? 4173);
const publicUrl = process.env.PUBLIC_URL?.replace(/\/$/, "");
const keyPath = process.env.TLS_KEY;
const certificatePath = process.env.TLS_CERT;
const root = resolve("dist");
const rooms = new Map<string, Room>();
const contentTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function localAddress(): string {
  const addresses = Object.values(networkInterfaces()).flatMap(
    (items) => items ?? [],
  );
  return (
    addresses.find((address) => address.family === "IPv4" && !address.internal)
      ?.address ?? "localhost"
  );
}

function send(socket: WebSocket, data: object): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}

function publishSlots(room: Room): void {
  const taken = [...room.players.values()].flatMap((player) =>
    player.slot === undefined ? [] : [player.slot],
  );
  room.players.forEach((_player, socket) =>
    send(socket, { type: "slots", taken }),
  );
}

function chooseSlot(room: Room, socket: WebSocket, slot: unknown): void {
  const player = room.players.get(socket);
  if (!player || (slot !== 1 && slot !== 2)) return;
  const taken = [...room.players.entries()].some(
    ([other, value]) => other !== socket && value.slot === slot,
  );
  if (taken) {
    send(socket, { type: "slot-taken", slot });
    publishSlots(room);
    return;
  }
  if (player.slot !== undefined && player.slot !== slot) {
    send(room.host, { type: "left", id: player.id });
  }
  if (player.slot !== slot) {
    player.slot = slot;
    send(room.host, { type: "joined", id: player.id, slot });
  }
  send(socket, { type: "joined", id: player.id, slot });
  publishSlots(room);
}

const handler: RequestListener = (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/api/config") {
    const scheme = keyPath && certificatePath ? "https" : "http";
    const url = publicUrl ?? `${scheme}://${localAddress()}:${port}`;
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ publicUrl: url }));
    return;
  }
  const name = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = resolve(join(root, name));
  if (!file.startsWith(`${root}/`)) {
    response.writeHead(403).end();
    return;
  }
  readFile(file, (error, content) => {
    if (error) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
    });
    response.end(content);
  });
};

const server =
  keyPath && certificatePath
    ? createSecureServer(
        { key: readFileSync(keyPath), cert: readFileSync(certificatePath) },
        handler,
      )
    : createServer(handler);
const sockets = new WebSocketServer({ server, maxPayload: 1024 });

sockets.on("connection", (socket, request) => {
  socket.on("error", () => socket.terminate());
  const url = new URL(request.url ?? "/", "http://localhost");
  const role = url.searchParams.get("role");
  if (role === "host") {
    const token = randomBytes(18).toString("base64url");
    const room: Room = { host: socket, players: new Map() };
    rooms.set(token, room);
    send(socket, { type: "room", token });
    socket.on("close", () => {
      rooms.delete(token);
      room.players.forEach((_id, player) =>
        player.close(1000, "Host disconnected"),
      );
    });
    return;
  }
  const room = rooms.get(url.searchParams.get("room") ?? "");
  if (role !== "player" || !room || room.players.size >= 2) {
    socket.close(1008, "Session unavailable or full");
    return;
  }
  const id = randomUUID();
  room.players.set(socket, { id });
  send(socket, { type: "lobby" });
  publishSlots(room);
  socket.on("message", (message) => {
    try {
      const data: unknown = JSON.parse(message.toString());
      if (
        typeof data === "object" &&
        data !== null &&
        "type" in data &&
        data.type === "select"
      ) {
        chooseSlot(room, socket, "slot" in data ? data.slot : undefined);
        return;
      }
      if (room.players.get(socket)?.slot === undefined) return;
      const state = parseControllerState(data);
      if (state) send(room.host, { type: "input", id, state });
    } catch {
      return;
    }
  });
  socket.on("close", () => {
    const selected = room.players.get(socket)?.slot !== undefined;
    room.players.delete(socket);
    if (selected) send(room.host, { type: "left", id });
    publishSlots(room);
  });
});

server.listen(port, "0.0.0.0", () => {
  const address = server.address();
  const listeningPort =
    typeof address === "object" && address ? address.port : port;
  console.log(
    `Controller playground: http${keyPath && certificatePath ? "s" : ""}://localhost:${listeningPort}`,
  );
  if (!publicUrl && !keyPath)
    console.log(
      "Phone motion requires HTTPS. Set PUBLIC_URL to a trusted HTTPS tunnel or configure TLS_KEY and TLS_CERT.",
    );
});
