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
  state?: { x: number; primary: boolean };
}

interface Peer {
  socket: WebSocket;
  next: () => Promise<Message>;
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
  return {
    socket,
    next: () => {
      const message = queue.shift();
      return message
        ? Promise.resolve(message)
        : new Promise((resolve) => waiting.push(resolve));
    },
  };
}

test("pairs two phones, relays input, and clears disconnected players", async (context) => {
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
  const room = (await host.next()).token;
  assert.ok(room);
  const playerUrl = `ws://localhost:${port}/?role=player&room=${room}`;
  const first = peer(playerUrl);
  const firstJoin = await first.next();
  assert.equal(firstJoin.slot, 1);
  assert.equal((await host.next()).id, firstJoin.id);
  const second = peer(playerUrl);
  assert.equal((await second.next()).slot, 2);
  await host.next();
  first.socket.send(
    JSON.stringify({
      mode: "wheel",
      x: 0.5,
      y: 0,
      primary: true,
      secondary: false,
    }),
  );
  const input = await host.next();
  assert.equal(input.id, firstJoin.id);
  assert.deepEqual(input.state?.x, 0.5);
  assert.equal(input.state?.primary, true);
  const third = peer(playerUrl);
  assert.equal((await once(third.socket, "close"))[0], 1008);
  first.socket.close();
  assert.equal((await host.next()).type, "left");
  const replacement = peer(playerUrl);
  assert.equal((await replacement.next()).slot, 1);
  const secondClosed = once(second.socket, "close");
  const replacementClosed = once(replacement.socket, "close");
  host.socket.close();
  await Promise.all([secondClosed, replacementClosed]);
});
