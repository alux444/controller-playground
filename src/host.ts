import QRCode from "qrcode";
import type { ControllerState } from "../server/protocol.ts";
import { element, socketUrl } from "./dom.ts";
import { createAimStage } from "./aim-stage.ts";

interface PlayerView {
  element: HTMLElement;
  wheel: HTMLElement;
  marker: HTMLElement;
  values: HTMLElement;
  primary: HTMLElement;
  secondary: HTMLElement;
  lastInput: number;
}

export function showHost(app: HTMLElement): void {
  app.innerHTML = `
    <main class="host-shell">
      <header class="topbar">
        <a class="wordmark" href="/">Controller playground</a>
        <span class="tag"><i></i> A shared-screen experiment</span>
      </header>
      <section class="host-intro">
        <div><h1>Controller playground</h1><p class="intro-copy">Connect a phone and try the controls.</p></div>
        <div class="corner-note"><strong id="count">0<span> / 2</span></strong><p>phones connected</p></div>
      </section>
      <section class="console" aria-label="Controller monitor">
        <div class="console-header"><div><h2>Live input</h2><p class="panel-hint">Inputs from connected phones.</p></div><span class="status" id="host-status"><i></i> Starting session</span></div>
        <div class="console-content">
          <div class="monitor"><section class="aim-panel" id="aim-panel" aria-label="Shared aiming preview" hidden><div class="aim-heading"><h3>Aim together</h3><p>Each player has their own crosshair</p></div><div class="aim-field" id="aim-field"></div></section><div class="player-grid" id="players"><div class="empty"><div class="empty-icon">⌁</div><h3>No phones connected</h3><p>Scan the code to join this session.</p></div></div></div>
          <aside class="pairing"><div class="pairing-top"><span>Connect a phone</span></div><div class="qr-frame"><canvas id="qr" aria-label="QR code for joining this session"></canvas></div><p>Scan with your phone’s camera.</p><div class="pairing-link"><span>Or open this link</span><a id="join-link" href="#">Preparing link…</a></div></aside>
        </div>
        <div class="console-footer"><span>Keep this page open</span><span>Up to two phones</span></div>
      </section>
    </main>`;
  const socket = new WebSocket(socketUrl("host"));
  const players = new Map<string, PlayerView>();
  const aimStage = createAimStage();
  const playerArea = element<HTMLElement>("#players");
  const status = element<HTMLElement>("#host-status");
  const count = element<HTMLElement>("#count");

  function updateCount(): void {
    count.innerHTML = `${players.size}<span> / 2</span>`;
    if (players.size === 0)
      playerArea.innerHTML =
        '<div class="empty"><div class="empty-icon">⌁</div><h3>No phones connected</h3><p>Scan the code to join this session.</p></div>';
  }

  function addPlayer(id: string, slot: number): void {
    if (players.size === 0) playerArea.innerHTML = "";
    const card = document.createElement("article");
    card.className = "player";
    card.dataset.slot = String(slot);
    card.innerHTML = `<div class="player-top"><span>PLAYER ${String(slot).padStart(2, "0")}</span><span class="player-status">● Connected</span></div><div class="display"><div class="crosshair"></div><div class="wheel-visual"><span></span><span></span><span></span><b>✳</b></div><div class="marker"></div></div><div class="player-bottom"><div><span class="label">Controller</span><strong class="values">Wheel · 0%</strong></div><div class="button-indicators"><span class="indicator primary">A</span><span class="indicator secondary">B</span></div></div>`;
    const nextPlayer = [
      ...playerArea.querySelectorAll<HTMLElement>(".player"),
    ].find((other) => Number(other.dataset.slot) > slot);
    playerArea.insertBefore(card, nextPlayer ?? null);
    players.set(id, {
      element: card,
      wheel: element(".wheel-visual", card),
      marker: element(".marker", card),
      values: element(".values", card),
      primary: element(".primary", card),
      secondary: element(".secondary", card),
      lastInput: Date.now(),
    });
    aimStage.add(id, slot);
    updateCount();
  }

  function updatePlayer(id: string, state: ControllerState): void {
    const player = players.get(id);
    if (!player) return;
    player.lastInput = Date.now();
    player.element.classList.toggle("is-gamepad", state.mode !== "wheel");
    player.element.classList.toggle("is-twin-stick", state.mode === "twin-stick");
    player.wheel.style.transform = `rotate(${state.x * 90}deg)`;
    const markerX = state.mode === "motion-pointer" ? state.aimX : state.x;
    const markerY = state.mode === "motion-pointer" ? state.aimY : state.y;
    player.marker.style.transform = `translate(${markerX * 65}px, ${markerY * 65}px)`;
    player.values.textContent =
      state.mode === "wheel"
        ? `Wheel · ${Math.round(state.x * 100)}%`
        : state.mode === "twin-stick"
          ? "Twin sticks"
          : state.mode === "motion-pointer"
            ? "Motion pointer"
            : `Stick · ${Math.round(state.x * 100)} / ${Math.round(state.y * 100)}`;
    aimStage.update(id, state);
    player.primary.classList.toggle("active", state.primary);
    player.secondary.classList.toggle("active", state.secondary);
    element<HTMLElement>(".player-status", player.element).textContent =
      "● Connected";
  }

  setInterval(
    () =>
      players.forEach((player, id) => {
        if (Date.now() - player.lastInput < 1800) return;
        updatePlayerNeutral(player);
        aimStage.pause(id);
      }),
    500,
  );

  socket.addEventListener("message", async (event: MessageEvent<string>) => {
    const message = JSON.parse(event.data) as {
      type: string;
      token?: string;
      id?: string;
      slot?: number;
      state?: ControllerState;
    };
    if (message.type === "room" && message.token) {
      const config = (await fetch("/api/config").then((response) =>
        response.json(),
      )) as { publicUrl: string };
      const join = new URL(config.publicUrl);
      join.searchParams.set("join", message.token);
      const link = element<HTMLAnchorElement>("#join-link");
      link.href = join.toString();
      link.textContent = join.toString();
      await QRCode.toCanvas(
        element<HTMLCanvasElement>("#qr"),
        join.toString(),
        { width: 192, margin: 1, color: { dark: "#1a201b", light: "#f4f3e9" } },
      );
      status.innerHTML = "<i></i> Session active";
      if (join.protocol !== "https:")
        element<HTMLElement>(".pairing-link").insertAdjacentHTML(
          "beforeend",
          '<p class="notice">Phone motion needs HTTPS. Touch controls work on the local network.</p>',
        );
    }
    if (message.type === "joined" && message.id && message.slot)
      addPlayer(message.id, message.slot);
    if (message.type === "input" && message.id && message.state)
      updatePlayer(message.id, message.state);
    if (message.type === "left" && message.id) {
      players.get(message.id)?.element.remove();
      players.delete(message.id);
      aimStage.remove(message.id);
      updateCount();
    }
  });
  socket.addEventListener("close", () => {
    status.textContent = "Session closed · Refresh to retry";
  });
}

function updatePlayerNeutral(player: PlayerView): void {
  player.wheel.style.transform = "rotate(0deg)";
  player.marker.style.transform = "translate(0, 0)";
  player.primary.classList.remove("active");
  player.secondary.classList.remove("active");
  player.values.textContent = "Waiting for input";
  element<HTMLElement>(".player-status", player.element).textContent =
    "● Input paused";
}
