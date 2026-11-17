import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { buildSync } from "esbuild";

interface Status {
  phase: string;
  join: string;
  message: string;
}
type Reply = (status: Status) => void;
type RuntimeListener = (
  message: { type: string; tabId?: number },
  sender: object,
  reply: Reply,
) => boolean | undefined;
type SocketListener = (event: { data: string }) => void;

class FakeSocket {
  static OPEN = 1;
  static last: FakeSocket;
  readonly url: string;
  readonly listeners = new Map<string, SocketListener>();
  readyState = FakeSocket.OPEN;

  constructor(url: URL) {
    this.url = url.toString();
    FakeSocket.last = this;
  }
  addEventListener(type: string, listener: SocketListener): void {
    this.listeners.set(type, listener);
  }
  send(): void {}
  close(): void {
    this.readyState = 3;
  }
  receive(message: object): void {
    this.listeners.get("message")?.({ data: JSON.stringify(message) });
  }
}

test("extension creates a hosted room and forwards only Player 1's wheel", async () => {
  const result = buildSync({
    entryPoints: ["extension/background.ts"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    define: { PHONE_WHEEL_SERVICE_URL: JSON.stringify("https://wheel.example.invalid") },
  });
  const source = result.outputFiles[0]?.text;
  assert.ok(source);
  let listener: RuntimeListener | undefined;
  const sent: unknown[] = [];
  const chrome = {
    runtime: {
      onMessage: {
        addListener: (value: RuntimeListener): void => {
          listener = value;
        },
      },
    },
    tabs: {
      get: async (): Promise<{ url: string }> => ({ url: "https://wmmtd.xyz/" }),
      sendMessage: async (_tab: number, message: unknown): Promise<boolean> => {
        sent.push(message);
        return true;
      },
      onRemoved: { addListener: (): void => {} },
      onUpdated: { addListener: (): void => {} },
    },
  };
  runInNewContext(source, {
    chrome,
    WebSocket: FakeSocket,
    URL,
    setInterval: (): number => 1,
    clearInterval: (): void => {},
    Date,
    JSON,
  });
  assert.ok(listener);
  const start = new Promise<Status>((resolve) =>
    listener?.({ type: "start", tabId: 9 }, {}, resolve),
  );
  assert.equal((await start).phase, "starting");
  assert.equal(FakeSocket.last.url, "wss://wheel.example.invalid/?role=host");
  FakeSocket.last.receive({ type: "room", token: "test-token" });
  const status = await new Promise<Status>((resolve) =>
    listener?.({ type: "status" }, {}, resolve),
  );
  assert.equal(status.join, "https://wheel.example.invalid/?join=test-token");
  FakeSocket.last.receive({ type: "joined", id: "one", slot: 1 });
  FakeSocket.last.receive({
    type: "input",
    id: "two",
    state: { mode: "wheel", x: 0.9, y: 0, primary: true, secondary: false },
  });
  FakeSocket.last.receive({
    type: "input",
    id: "one",
    state: { mode: "wheel", x: 0.4, y: 0, primary: true, secondary: false },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(sent.at(-1))), {
    type: "wheel-input",
    input: { connected: true, steering: 0.4, accelerator: true, brake: false },
  });
  await new Promise<Status>((resolve) => listener?.({ type: "stop" }, {}, resolve));
  assert.deepEqual(JSON.parse(JSON.stringify(sent.at(-1))), {
    type: "wheel-input",
    input: { connected: false, steering: 0, accelerator: false, brake: false },
  });
});
