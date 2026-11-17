import { parseControllerState } from "../server/protocol.ts";

interface HostAttachment {
  role: "host";
}
interface PlayerAttachment {
  role: "player";
  id: string;
  slot?: number;
}
type Attachment = HostAttachment | PlayerAttachment;

const MESSAGE_LIMIT = 1024;
const PLAYER_LIMIT = 2;

export class Room {
  private readonly state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    if (role === "host") return this.connectHost(url.searchParams.get("room") ?? "");
    if (role === "player") return this.connectPlayer();
    return new Response("Session unavailable", { status: 400 });
  }

  private connectHost(room: string): Response {
    if (this.host()) return new Response("Session unavailable", { status: 409 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server, ["host"]);
    server.serializeAttachment({ role: "host" } satisfies HostAttachment);
    this.send(server, { type: "room", token: room });
    return new Response(null, { status: 101, webSocket: client });
  }

  private connectPlayer(): Response {
    if (!this.host() || this.players().length >= PLAYER_LIMIT) {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      server.close(1008, "Session unavailable or full");
      return new Response(null, { status: 101, webSocket: client });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server, ["player"]);
    server.serializeAttachment({
      role: "player",
      id: crypto.randomUUID(),
    } satisfies PlayerAttachment);
    this.send(server, { type: "lobby" });
    this.publishSlots();
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    const attachment = socket.deserializeAttachment() as Attachment | null;
    if (
      attachment?.role !== "player" ||
      typeof message !== "string" ||
      message.length > MESSAGE_LIMIT
    )
      return;
    try {
      const value: unknown = JSON.parse(message);
      if (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        value.type === "select"
      ) {
        this.select(socket, attachment, "slot" in value ? value.slot : undefined);
        return;
      }
      if (attachment.slot === undefined) return;
      const state = parseControllerState(value);
      if (state) this.send(this.host(), { type: "input", id: attachment.id, state });
    } catch {
      return;
    }
  }

  webSocketClose(socket: WebSocket): void {
    const attachment = socket.deserializeAttachment() as Attachment | null;
    if (attachment?.role === "host") {
      this.players().forEach((player) => player.close(1000, "Host disconnected"));
      return;
    }
    if (attachment?.role !== "player") return;
    if (attachment.slot !== undefined)
      this.send(this.host(), { type: "left", id: attachment.id });
    this.publishSlots(socket);
  }

  webSocketError(socket: WebSocket): void {
    socket.close(1011, "Connection error");
  }

  private select(socket: WebSocket, player: PlayerAttachment, slot: unknown): void {
    if (slot !== 1 && slot !== 2) return;
    const taken = this.players().some((other) => {
      const attachment = other.deserializeAttachment() as PlayerAttachment;
      return other !== socket && attachment.slot === slot;
    });
    if (taken) {
      this.send(socket, { type: "slot-taken", slot });
      this.publishSlots();
      return;
    }
    if (player.slot !== undefined && player.slot !== slot)
      this.send(this.host(), { type: "left", id: player.id });
    if (player.slot !== slot) {
      player.slot = slot;
      socket.serializeAttachment(player);
      this.send(this.host(), { type: "joined", id: player.id, slot });
    }
    this.send(socket, { type: "joined", id: player.id, slot });
    this.publishSlots();
  }

  private publishSlots(excluded?: WebSocket): void {
    const players = this.players().filter((player) => player !== excluded);
    const taken = players.flatMap((player) => {
      const attachment = player.deserializeAttachment() as PlayerAttachment;
      return attachment.slot === undefined ? [] : [attachment.slot];
    });
    players.forEach((player) => this.send(player, { type: "slots", taken }));
  }

  private host(): WebSocket | undefined {
    return this.state.getWebSockets("host")[0];
  }

  private players(): WebSocket[] {
    return this.state.getWebSockets("player");
  }

  private send(socket: WebSocket | undefined, message: object): void {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }
}
