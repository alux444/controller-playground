import { parseControllerState } from "../server/protocol.ts";
import { mapWheel, neutralWheel, type WheelInput } from "./mapping.ts";

interface HostMessage {
  type: string;
  token?: string;
  id?: string;
  slot?: number;
  state?: unknown;
}

interface BridgeStatus {
  phase: "idle" | "starting" | "ready" | "error";
  join: string;
  message: string;
}

declare const PHONE_WHEEL_SERVICE_URL: string;
let status: BridgeStatus = {
  phase: "idle",
  join: "",
  message: "Open WMMTD, then connect.",
};
let socket: WebSocket | undefined;
let gameTab: number | undefined;
let playerId: string | undefined;
let lastInput = 0;
let watchdog: ReturnType<typeof setInterval> | undefined;
let generation = 0;

function sendInput(input: WheelInput): void {
  if (gameTab === undefined) return;
  void chrome.tabs
    .sendMessage(gameTab, { type: "wheel-input", input })
    .catch(() => undefined);
}

function stop(): void {
  generation += 1;
  sendInput({ ...neutralWheel });
  if (watchdog !== undefined) clearInterval(watchdog);
  watchdog = undefined;
  socket?.close();
  socket = undefined;
  gameTab = undefined;
  playerId = undefined;
  lastInput = 0;
  status = { phase: "idle", join: "", message: "Open WMMTD, then connect." };
}

function handleHostMessage(event: MessageEvent<string>, publicUrl: string): void {
  const message = JSON.parse(event.data) as HostMessage;
  if (message.type === "room" && message.token) {
    const url = new URL(publicUrl);
    url.searchParams.set("join", message.token);
    status = {
      phase: "ready",
      join: url.toString(),
      message: "Scan the code and choose Player 1 → Wheel.",
    };
  }
  if (message.type === "joined" && message.slot === 1) playerId = message.id;
  if (message.type === "left" && message.id === playerId) {
    playerId = undefined;
    sendInput({ ...neutralWheel });
  }
  if (message.type !== "input" || message.id !== playerId) return;
  const state = parseControllerState(message.state);
  if (!state) return;
  lastInput = Date.now();
  sendInput(mapWheel(state));
}

async function start(tabId: number): Promise<BridgeStatus> {
  stop();
  const currentGeneration = generation;
  status = { phase: "starting", join: "", message: "Connecting to the playground…" };
  try {
    const tab = await chrome.tabs.get(tabId);
    if (currentGeneration !== generation) return status;
    if (!tab.url?.startsWith("https://wmmtd.xyz/"))
      throw new Error("Open WMMTD in the active tab first.");
    await chrome.tabs.sendMessage(tabId, { type: "wheel-ping" });
    if (currentGeneration !== generation) return status;
    gameTab = tabId;
    const socketUrl = new URL(PHONE_WHEEL_SERVICE_URL);
    socketUrl.protocol = "wss:";
    socketUrl.searchParams.set("role", "host");
    const nextSocket = new WebSocket(socketUrl);
    socket = nextSocket;
    nextSocket.addEventListener("message", (event: MessageEvent<string>) => {
      if (socket === nextSocket) handleHostMessage(event, PHONE_WHEEL_SERVICE_URL);
    });
    nextSocket.addEventListener("close", () => {
      if (socket !== nextSocket) return;
      sendInput({ ...neutralWheel });
      if (watchdog !== undefined) clearInterval(watchdog);
      watchdog = undefined;
      socket = undefined;
      status = {
        phase: "error",
        join: "",
        message: "Connection ended. Try connecting again.",
      };
    });
    watchdog = setInterval(() => {
      if (lastInput > 0 && Date.now() - lastInput > 900) {
        lastInput = 0;
        sendInput({ ...neutralWheel });
      }
      if (nextSocket.readyState === WebSocket.OPEN) nextSocket.send("{}");
    }, 1000);
  } catch (error) {
    if (currentGeneration !== generation) return status;
    const message =
      error instanceof Error && error.message.startsWith("Open WMMTD")
        ? error.message
        : "Could not connect. Reload the WMMTD tab and try again.";
    status = { phase: "error", join: "", message };
  }
  return status;
}

chrome.runtime.onMessage.addListener(
  (
    message: { type?: string; tabId?: number },
    _sender,
    respond: (result: BridgeStatus) => void,
  ) => {
    if (message.type === "status") {
      respond(status);
      return;
    }
    if (message.type === "stop") {
      stop();
      respond(status);
      return;
    }
    if (message.type === "start" && typeof message.tabId === "number") {
      void start(message.tabId).then(respond);
      return true;
    }
  },
);

chrome.tabs.onRemoved.addListener((tabId: number) => {
  if (tabId === gameTab) stop();
});
chrome.tabs.onUpdated.addListener((tabId: number, change: { status?: string }) => {
  if (tabId === gameTab && change.status === "loading") stop();
});
