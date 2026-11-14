import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";
import WebSocket from "ws";

interface Message {
  type: string;
  token?: string;
  id?: string;
  slot?: number;
  taken?: number[];
  state?: { x: number; primary: boolean };
}

interface Peer {
  socket: WebSocket;
  next: () => Promise<Message>;
  nextType: (type: string) => Promise<Message>;
}

function peer(url: string): Peer {
  const socket = new WebSocket(url);
  const queue: Message[] = [];
  const waiting: ((message: Message) => void)[] = [];
  socket.on("message", (data) => {
    const message = JSON.parse(data.toString()) as Message;
    const next = waiting.shift();
    if (next) next(message);
    else queue.push(message);
  });
  function next(): Promise<Message> {
    const message = queue.shift();
    return message
      ? Promise.resolve(message)
      : new Promise((resolve) => waiting.push(resolve));
  }
  async function nextType(type: string): Promise<Message> {
    let message = await next();
    while (message.type !== type) message = await next();
    return message;
  }
  return { socket, next, nextType };
}

test(
  "players choose slots, cannot take an occupied slot, and can reuse a freed slot",
  { timeout: 10000 },
  async (context) => {
    const server = spawn(process.execPath, ["server/index.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    context.after(() => server.kill());
    const [output] = (await once(server.stdout, "data")) as [Buffer];
    const port = /localhost:(\d+)/.exec(output.toString())?.[1];
    assert.ok(port);
    const host = peer(`ws://localhost:${port}/?role=host`);
    const room = (await host.nextType("room")).token;
    assert.ok(room);
    const playerUrl = `ws://localhost:${port}/?role=player&room=${room}`;
    const first = peer(playerUrl);
    await first.nextType("lobby");
    first.socket.send(JSON.stringify({ type: "select", slot: 2 }));
    const firstJoin = await first.nextType("joined");
    assert.equal(firstJoin.slot, 2);
    assert.equal((await host.nextType("joined")).id, firstJoin.id);
    const second = peer(playerUrl);
    await second.nextType("lobby");
    second.socket.send(JSON.stringify({ type: "select", slot: 2 }));
    assert.equal((await second.nextType("slot-taken")).slot, 2);
    second.socket.send(JSON.stringify({ type: "select", slot: 1 }));
    assert.equal((await second.nextType("joined")).slot, 1);
    await host.nextType("joined");
    first.socket.send(
      JSON.stringify({
        mode: "wheel",
        x: 0.5,
        y: 0,
        primary: true,
        secondary: false,
      }),
    );
    const input = await host.nextType("input");
    assert.equal(input.id, firstJoin.id);
    assert.equal(input.state?.x, 0.5);
    assert.equal(input.state?.primary, true);
    const third = peer(playerUrl);
    assert.equal((await once(third.socket, "close"))[0], 1008);
    first.socket.close();
    assert.equal((await host.nextType("left")).id, firstJoin.id);
    const replacement = peer(playerUrl);
    await replacement.nextType("lobby");
    replacement.socket.send(JSON.stringify({ type: "select", slot: 2 }));
    assert.equal((await replacement.nextType("joined")).slot, 2);
    const secondClosed = once(second.socket, "close");
    const replacementClosed = once(replacement.socket, "close");
    host.socket.close();
    await Promise.all([secondClosed, replacementClosed]);
  },
);
