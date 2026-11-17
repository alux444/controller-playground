import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import WebSocket from "ws";

interface RelayMessage {
  type: string;
  token?: string;
  id?: string;
  slot?: number;
  state?: { x: number; primary: boolean };
}

interface Peer {
  socket: WebSocket;
  next: (type: string) => Promise<RelayMessage>;
}

function peer(url: string): Peer {
  const socket = new WebSocket(url);
  const queue: RelayMessage[] = [];
  const waiting: ((message: RelayMessage) => void)[] = [];
  socket.on("message", (data) => {
    const message = JSON.parse(data.toString()) as RelayMessage;
    const resolve = waiting.shift();
    if (resolve) resolve(message);
    else queue.push(message);
  });
  function take(): Promise<RelayMessage> {
    const message = queue.shift();
    return message
      ? Promise.resolve(message)
      : new Promise((resolve) => waiting.push(resolve));
  }
  async function next(type: string): Promise<RelayMessage> {
    const message = await take();
    if (message.type === type) return message;
    return next(type);
  }
  return { socket, next };
}

async function unusedPort(): Promise<number> {
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  assert.ok(address && typeof address !== "string");
  await new Promise<void>((resolve, reject) =>
    listener.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}

async function waitForWorker(url: string, attempts: number = 0): Promise<void> {
  try {
    const response = await fetch(`${url}/api/config`);
    if (response.ok) return;
  } catch {
    if (attempts >= 100) throw new Error("Cloudflare Worker did not start");
  }
  if (attempts >= 100) throw new Error("Cloudflare Worker did not start");
  await delay(100);
  return waitForWorker(url, attempts + 1);
}

test("Cloudflare relay pairs players, forwards input and ends the session with its host", {
  timeout: 25000,
}, async (context) => {
  const port = await unusedPort();
  const process = spawn(
    "./node_modules/.bin/wrangler",
    ["dev", "--local", "--port", String(port), "--log-level", "error"],
    {
      env: { ...globalThis.process.env, CI: "1", WRANGLER_SEND_METRICS: "false" },
      stdio: "ignore",
    },
  );
  context.after(() => process.kill());
  const origin = `http://127.0.0.1:${port}`;
  await waitForWorker(origin);
  const config = (await fetch(`${origin}/api/config`).then((response) =>
    response.json(),
  )) as { publicUrl: string };
  assert.equal(config.publicUrl, origin);
  assert.equal((await fetch(origin)).status, 200);

  const host = peer(`ws://127.0.0.1:${port}/?role=host`);
  const token = (await host.next("room")).token;
  assert.ok(token);
  const playerUrl = `ws://127.0.0.1:${port}/?role=player&room=${token}`;
  const first = peer(playerUrl);
  await first.next("lobby");
  first.socket.send(JSON.stringify({ type: "select", slot: 1 }));
  const player = await first.next("joined");
  assert.equal((await host.next("joined")).id, player.id);

  const second = peer(playerUrl);
  await second.next("lobby");
  second.socket.send(JSON.stringify({ type: "select", slot: 1 }));
  assert.equal((await second.next("slot-taken")).slot, 1);
  second.socket.send(JSON.stringify({ type: "select", slot: 2 }));
  await second.next("joined");
  await host.next("joined");
  first.socket.send(
    JSON.stringify({ mode: "wheel", x: 0.45, y: 0, primary: true, secondary: false }),
  );
  const input = await host.next("input");
  assert.equal(input.id, player.id);
  assert.equal(input.state?.x, 0.45);
  assert.equal(input.state?.primary, true);

  const third = peer(playerUrl);
  assert.equal((await once(third.socket, "close"))[0], 1008);
  const firstClosed = once(first.socket, "close");
  const secondClosed = once(second.socket, "close");
  host.socket.close();
  await Promise.all([firstClosed, secondClosed]);
});
